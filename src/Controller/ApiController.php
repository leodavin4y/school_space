<?php

namespace App\Controller;

use App\Service\Widget;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use App\Service\UploadFiles;
use App\Service\SerializerHelper;
use App\Service\VKAPI;
use App\Entity\Points;
use App\Entity\PointsPhotos;
use App\Entity\History;
use App\Repository\PointsRepository;
use App\Repository\AdminsRepository;
use App\Repository\UsersRepository;
use App\Repository\HistoryRepository;
use App\Repository\OrdersRepository;
use App\Repository\TopUsersRepository;

class ApiController extends BaseApiController {

    public function __construct(RequestStack $requestStack, ValidatorInterface $validator, UsersRepository $usersRep)
    {
        parent::__construct($requestStack, $validator, $usersRep);
    }

    /**
     * 1. Профиль пользователя
     * 2. Список самых активных пользователей
     * @Route("/api/init", name="api_init")
     *
     * @param UsersRepository $usersRep
     * @param TopUsersRepository $topUsersRep
     * @param AdminsRepository $adminsRep
     * @param HistoryRepository $historyRep
     * @param SerializerHelper $serializer
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Doctrine\ORM\NonUniqueResultException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function init(
        UsersRepository $usersRep,
        TopUsersRepository $topUsersRep,
        AdminsRepository $adminsRep,
        HistoryRepository $historyRep,
        SerializerHelper $serializer
    ): JsonResponse
    {
        $student = $usersRep->find($this->uid);

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $serializer = $serializer
            ->convertField('date_at', $converter)
            ->convertField('created_at', $converter)
            ->getSerializer();

        if ($student) {
            $student = $serializer->normalize($student, 'json', ['groups' => ['TopUsers', 'Students']]);
        }

        $topUsers = $topUsersRep->getMostActive(1, 4);
        $top = $serializer->normalize($topUsers, 'json', ['groups' => ['TopUsers']]);

        return $this->createResponse([
            'user' => [
                'is_admin' => $adminsRep->find($this->uid) ? true : false,
                'info' => $student,
                'rating' => $topUsersRep->getUser($this->uid)
            ],
            'top_users' => $top,
            'store_actions_counter' => $historyRep->getOrdersCount($this->uid)
        ]);
    }

    /**
     * Отдает массив Points (дат) за которые уже есть оценки в тек. месяце
     *
     * @Route("/api/calendar/get", methods={"POST"}, name="api_calendar_get")
     * @param PointsRepository $pointsRep
     * @return JsonResponse
     */
    public function calendar(PointsRepository $pointsRep): JsonResponse
    {
        $points = $pointsRep->getPointsByCurMonth($this->uid);

        foreach ($points as $key => $point) {
            unset($point['created_at']);
            unset($point['student_id']);

            /**
             * @var \DateTime $dateAt
             */
            $dateAt = $point['date_at'];
            $point['date_at'] = $dateAt->format('Y-m-d');
            $points[$key] = $point;
        }

        return $this->createResponse($points);
    }

    /**
     * Загрузка фотографий школьного дневника
     *
     * @Route("/api/points/store", methods={"POST"}, name="api_points_store")
     * @param UploadFiles $uploadFiles
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     * @param VKAPI $vk
     * @return JsonResponse
     * @throws \Exception
     */
    public function uploadDiaries(UploadFiles $uploadFiles, ValidatorInterface $validator, UsersRepository $usersRep, VKAPI $vk)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $params = $this->request->request->all();
        $files = $this->request->files->get('images');

        if (is_null($files) || count($files) === 0) throw new HttpException(422, 'No files found');

        $constraints1 = new Assert\Collection([
            'fields' => [
                'date_at' => [
                    new Assert\Type(['string', 'digit']),
                    new Assert\Range([
                        'min' => 1601485200, // 2000
                        'max' => strtotime('now + 1 month')
                    ])
                ],
            ],
            'allowExtraFields' => true
        ]);
        $constraints2 = new Assert\All([
            'constraints' => [
                new Assert\File([
                    'binaryFormat' => true
                ])
            ]
        ]);

        $errors1 = $validator->validate($params, $constraints1);
        $errors2 = $validator->validate($files, $constraints2);

        if (count($errors1) > 0 || count($errors2) > 0) throw new HttpException(422, 'Validation error');

        $student = $usersRep->find($this->uid);

        if (!$student || !$student->getCity() || !$student->getSchool() || !$student->getClass() || !$student->getTeacher()) throw new HttpException(403, 'Access forbidden');

        /*
        $dateAt = date('Y-m-d', $params['date_at']);
        $point = $pointRep->getOneByDateAt($this->uid, $dateAt);

        if ($point) throw new HttpException(409, 'Already exist');
        */

        try {
            $prefix = $this->uid . '_' . date('d-m-y') . '_';
            $uploadedFiles = $uploadFiles
                ->setUploadDir('/var/upload')
                ->setNamePrefix($prefix)
                ->setFiles($files)
                ->processFiles();
        } catch (\Exception $e) {
            throw new HttpException(500, $e->getMessage());
        }

        $em = $this->getDoctrine()->getManager();
        $connect = $this->getDoctrine()->getConnection();
        $connect->beginTransaction();

        try {
            $point = new Points();
            $dateAt = (new \DateTime())->setTimestamp($params['date_at']);

            $point->setDateAt($dateAt)
                ->setCreatedAt(new \DateTime())
                ->setUser($student);

            foreach ($uploadedFiles as $file) {
                $pointPhoto = (new PointsPhotos())
                    ->setName($file->getFilename())
                    ->setPoint($point);

                $em->persist($pointPhoto);
            }

            $history = (new History())
                ->setPoints($point)
                ->setUser($student);

            $em->persist($history);
            $em->persist($point);

            $em->flush();
            $connect->commit();
        } catch (\Exception $e) {
            $connect->rollback();

            throw $e;
        }

        $msgSubscribe = $vk->method('messages.isMessagesFromGroupAllowed', [
            'group_id' => $_ENV['GROUP_ID'],
            'user_id' => $this->uid,
            'access_token' => $_ENV['GROUP_TOKEN'],
            'v' => 5.126
        ]);

        return $this->createResponse([
            'msg_allowed' => $msgSubscribe->response->is_allowed
        ]);
    }

    /**
     * @Route("/api/profile/reports/points-per-month", methods={"POST"}, name="api_report_points-per-month")
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     * @param PointsRepository $pointsRep
     * @throws \Exception
     * @return JsonResponse
     */
    public function profilePointsPerMonth(ValidatorInterface $validator, UsersRepository $usersRep, PointsRepository $pointsRep)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'month' => [
                    new Assert\NotBlank,
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1,
                        'max' => 12
                    ])
                ],
            ],
            'allowExtraFields' => true
        ]);

        if (count($validator->validate($params, $constraints)) > 0)
            throw new HttpException(422, 'Validation error');

        $user = $usersRep->find($this->uid);
        if (!$user) throw new HttpException(403, 'Access forbidden');

        $dateStr = date('Y-' . ($params['month'] < 10 ? '0' . $params['month'] : $params['month']) . '-d');
        $date = new \DateTime($dateStr);

        return $this->createResponse([
            'total' => $pointsRep->getTotalPointsPerMonth($this->uid, $date)
        ]);
    }

    /**
     * @Route("/api/profile/reports/best-results", methods={"POST"}, name="api_report_best-results")
     * @param PointsRepository $pointsRep
     * @return JsonResponse
     */
    public function bestResults(PointsRepository $pointsRep)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        return $this->createResponse([
            'report_day' => $pointsRep->reportMaxPointsPerDay($this->uid),
            'report_month' => $pointsRep->reportMaxPointsPerMonth($this->uid)
        ]);
    }

    /**
     * @Route("/api/reports/total-stats", methods={"POST"}, name="api_report_total-stats")
     */
    public function pointsUsers()
    {
        $data = $this->getDoctrine()
            ->getConnection()
            ->query("
                SELECT COUNT(*) as users_total, SUM(t.points_per_user) as points_total 
                  FROM (SELECT SUM(amount) as points_per_user FROM `points` 
                    WHERE verify = 1 AND MONTH(date_at) = MONTH(CURDATE()) 
                  GROUP BY student_id) as t
            ")->fetch();

        return $this->createResponse([
            'points_total' => intval($data['points_total']),
            'users_total' => intval($data['users_total'])
        ]);
    }

    /**
     * @Route("/api/orders/{orderId}/message/send", methods={"POST"}, name="api_orders_message")
     * @param int $orderId
     * @param OrdersRepository $ordersRep
     * @param VKAPI $vk
     * @return JsonResponse
     */
    public function purchaseNotificationSend(int $orderId, OrdersRepository $ordersRep, VKAPI $vk): JsonResponse
    {
        $order = $ordersRep->find($orderId);

        if (!$order) throw new HttpException(422, 'Order not found');

        $uid = $order->getUser()->getUserId();
        $productName = $order->getProduct()->getName();
        $promoCode = $order->getPromoCode() ? $order->getPromoCode()->getCode() : null;

        $str = [];
        $str[] = "#{$order->getId()}";
        $str[]= "Покупка: «{$productName}».";
        if ($promoCode) $str[] = "Промокод: «{$promoCode}».";
        $str[] = '';
        $str[] = 'Скоро ваш заказ обработают. Обработка может занимать до 48 часов.';

        $msg = implode("\r\n", $str);

        $send = $vk->method('messages.send', [
            'user_id' => $uid,
            'random_id' => $_ENV['APP_ID'] + $order->getId() + time(),
            'message' => $msg,
            'access_token' => $_ENV['GROUP_TOKEN'],
            'v' => 5.124
        ]);

        $data = [];
        $status = isset($send->response);

        if (!$status) {
            $errorCode = $send->error->error_code ?? 0;
            $data['msg'] = $errorCode === 901 ? 'Вы не подписаны на сообщения сообщества' : 'Ошибка отправки уведомления в личные сообщения';
        }

        return $this->createResponse($data, $status);
    }

    /**
     * @Route("/api/history/{userId}/get", name="api_history_get")
     *
     * @param int $userId
     * @param OrdersRepository $ordersRep
     * @param ValidatorInterface $validator
     * @param SerializerHelper $serializer
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function getHistory(
        int $userId,
        OrdersRepository $ordersRep,
        ValidatorInterface $validator,
        SerializerHelper $serializer
    ): JsonResponse
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'page' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type('integer'),
                    new Assert\Range([
                        'min' => 1
                    ])
                ])
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');
        if ($this->user->getUserId() !== $userId) throw new HttpException(403, 'Forbidden');

        $history = $ordersRep->get($userId, $params['page'] ?? 1);

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $history = $serializer
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($history, 'json', ['groups' => ['History', 'Orders', 'Points', 'Products', 'Promo']]);

        return $this->createResponse($history);
    }

    /**
     * Возвращает пользователей о которых упоминается на вкладке "Инфо"
     *
     * @Route("/api/users-tab", methods={"POST"}, name="api_users_tab")
     *
     * @param VKAPI $vk
     * @return JsonResponse
     * @throws \Exception
     */
    public function usersForInfoTab(VKAPI $vk): JsonResponse
    {
        // Пользователи, отображаемые в подписчиках на вкладке инфо
        $subscriberIds = [35645976, 35226283, 140086594];
        $moderatorIds = [322462331, 241894642, 535108504];
        $profiles = $vk->usersGet(array_merge($moderatorIds, $subscriberIds));
        $subscribers = $moderators = [];

        foreach ($profiles as $profile) {
            $uid = $profile->id;

            if (in_array($uid, $subscriberIds)) $subscribers[] = $profile;
            if (in_array($uid, $moderatorIds)) $moderators[] = $profile;
        }

        return $this->createResponse([
            'subscribers' => $subscribers,
            'moderators' => $moderators
        ]);
    }

    /**
     * @Route("/api/widget", methods={"POST"}, name="api_widget")
     *
     * @param Widget $widget
     * @return JsonResponse
     */
    public function buildWidget(Widget $widget): JsonResponse
    {
        return $this->createResponse([
            'type' => 'tiles',
            'code' => $widget->build()
        ]);
    }
}