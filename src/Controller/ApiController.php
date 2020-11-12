<?php

namespace App\Controller;

use App\Entity\History;
use App\Entity\Orders;
use App\Repository\HistoryRepository;
use App\Repository\OrdersRepository;
use App\Repository\ProductsRepository;
use App\Repository\TopUsersRepository;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use App\Service\UploadFiles;
use App\Service\SerializerHelper;
use App\Service\VKAPI;
use App\Service\Utils;
use App\Service\Letscover;
use App\Entity\Users;
use App\Entity\Points;
use App\Entity\PointsPhotos;
use App\Repository\PointsRepository;
use App\Repository\AdminsRepository;
use App\Repository\UsersRepository;

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
     * @Route("/api/users", name="api_users")
     * @param ValidatorInterface $validator
     * @param TopUsersRepository $topUsersRep
     * @return JsonResponse
     */
    public function topUsers(ValidatorInterface $validator, TopUsersRepository $topUsersRep)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'page' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1,
                    ])
                ],
            ],
            'allowExtraFields' => true
        ]);

        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        return $this->createResponse($topUsersRep->getMostActive($params['page'], 10));
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
     * @param PointsRepository $pointRep
     * @return JsonResponse
     * @throws \Exception
     */
    public function uploadDiaries(UploadFiles $uploadFiles, ValidatorInterface $validator, UsersRepository $usersRep, PointsRepository $pointRep)
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

        return $this->createResponse();
    }

    /**
     * Сохранение профиля школьника
     *
     * @Route("/api/profile/store", methods={"POST"}, name="api_profile_store")
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     * @return JsonResponse
     * @throws \Exception
     */
    public function profileStore(ValidatorInterface $validator, UsersRepository $usersRep)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'city' => [
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                    new Assert\Length([
                        'min' => 2,
                        'max' => 255
                    ])
                ],
                'school' => [
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                    new Assert\Length([
                        'min' => 1,
                        'max' => 255
                    ])
                ],
                'class' => [
                    new Assert\NotBlank,
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1,
                        'max' => 11
                    ])
                ],
                'teacher' => [
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                    new Assert\Length(['max' => 255, 'min' => 10])
                ],
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $params = (object) $params;
        $uid = $this->uid;
        $em = $this->getDoctrine()->getManager();
        $student = $usersRep->find($uid);

        if (!$student) {
            $student = new Users();
        }

        $profile = VKAPI::usersGet($uid)[0];

        $student->setUserId($uid)
            ->setFirstName($profile->first_name)
            ->setLastName($profile->last_name)
            ->setPhoto100($profile->photo_100)
            ->setCity($params->city)
            ->setSchool($params->school)
            ->setClass($params->class)
            ->setTeacher($params->teacher);

        $em->persist($student);
        $em->flush();

        Letscover::addBalance($uid, 0);

        return $this->createResponse();
    }

    /**
     * @Route("/api/profile/get", methods={"POST"}, name="api_profile_get")
     * @param UsersRepository $usersRep
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function profileGet(UsersRepository $usersRep)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $user = (new SerializerHelper())
            ->convertField('date_at', $converter)
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($usersRep->find($this->uid), 'json', ['groups' => ['Students']]);

        return $this->createResponse([
            'user' => $user
        ]);
    }

    /**
     * Проверка наличия заполненного профиля школьника
     *
     * @Route("/api/profile/exist", methods={"POST"}, name="api_profile_exist")
     * @param UsersRepository $usersRep
     * @return JsonResponse
     */
    public function profileCheckExist(UsersRepository $usersRep)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $student = $usersRep->find($this->uid);

        return $this->createResponse([
            'exist' => !is_null($student) &&
                !is_null($student->getCity()) &&
                !is_null($student->getSchool()) &&
                !is_null($student->getClass()) &&
                !is_null($student->getTeacher())
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
     * @Route("/api/friends/get", methods={"POST"}, name="api_friends_get")
     * @param ValidatorInterface $validator
     * @param TopUsersRepository $topUsersRep
     * @return JsonResponse
     */
    public function friendsStats(ValidatorInterface $validator, TopUsersRepository $topUsersRep)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'friends' => new Assert\All([
                    new Assert\NotBlank,
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1
                    ])
                ]),
            ],
            'allowExtraFields' => true
        ]);

        if (count($validator->validate($params, $constraints)) > 0) throw new HttpException(422, 'Validation error');

        $friends = $topUsersRep->getByIds($params['friends']);

        return $this->createResponse($friends);
    }

    /**
     * @Route("/api/products/get", methods={"POST"}, name="api_products_get")
     * @param ProductsRepository $productsRep
     * @param ValidatorInterface $validator
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function getProducts(ProductsRepository $productsRep, ValidatorInterface $validator)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'enabled' => new Assert\Optional([
                    new Assert\Type('bool')
                ])
            ],
            'allowExtraFields' => true
        ]);

        if (count($validator->validate($params, $constraints)) > 0) throw new HttpException(422, 'Validation error');

        $products = $productsRep->findByEnabled($params['enabled'] ?? null);

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $products = (new SerializerHelper())
            ->convertField('date_at', $converter)
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($products, 'json', ['groups' => ['Products']]);

        return $this->createResponse($products);
    }

    /**
     * @Route("/api/products/{productId}/buy", methods={"POST"}, name="api_products_buy")
     * @param int $productId
     * @param UsersRepository $usersRep
     * @param ProductsRepository $productsRep
     * @param OrdersRepository $ordersRep
     * @param SerializerHelper $serializerHelper
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function buyProduct(
        int $productId,
        UsersRepository $usersRep,
        ProductsRepository $productsRep,
        OrdersRepository $ordersRep,
        SerializerHelper $serializerHelper
    ) {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $user = $usersRep->find($this->uid);

        if (!$user) throw new HttpException(422, 'User not found');

        $product = $productsRep->find($productId);

        if (!$product) throw new HttpException(422, 'Product not found');

        if ($product->getRemaining() <= 0) {
            return $this->createResponse(['msg' => 'Нет в наличии'], false);
        }

        if ($product->getPrice() > $user->getBalance()) {
            return $this->createResponse(['msg' => 'Недостаточно средств на счету'], false);
        }

        $allowedPurchases = $product->getRestrictFreq();
        $restrictInterval = $product->getRestrictFreqTime();

        if (!is_null($allowedPurchases) && !is_null($restrictInterval)) {
            $ordersCount = $ordersRep->getOrdersCountInInterval(
                $user->getUserId(),
                $productId,
                $restrictInterval
            );

            if ($ordersCount >= $allowedPurchases) {
                $remaining = $ordersRep->calcFreqRemaining($user->getUserId(), $productId, $restrictInterval, $allowedPurchases);
                $remaining = sprintf("%sч %'02sм", intval($remaining / 60 / 60), abs(intval(($remaining % 3600) / 60)));

                $h = intval($restrictInterval / 60 / 60);
                $m = abs(intval(($restrictInterval % 3600) / 60));
                $restricted = ($h > 0 ? "{$h}ч " : "") . ($m > 0 ? "{$m}м" : "");

                return $this->createResponse([
                    'msg' => 'Покупать можно не чаще чем ' .
                        Utils::declOfNum($allowedPurchases, ['%d раз', '%d раза', '%d раз']) .
                        ' за ' . $restricted. '. Осталось: ' . $remaining
                ], false);
            }
        }

        $em = $this->getDoctrine()->getManager();
        $connect = $this->getDoctrine()->getConnection();
        $connect->beginTransaction();

        try {
            $user->setBalance($user->getBalance() - $product->getPrice());
            $sendToApi = Letscover::subBalance($user->getUserId(), $product->getPrice());

            if (!$sendToApi) throw new \Exception('Failed to set letscover balance');

            $product->setRemaining($product->getRemaining() - 1);
            $order = (new Orders())
                ->setUser($user)
                ->setProduct($product)
                ->setCreatedAt(new \DateTime());

            if ($product->getPromoCount()) {
                if (count($promoCodes = $product->getUnusedPromoCodes()) === 0) throw new \Exception('Promo codes not found', 100);

                $promoCode = $promoCodes[mt_rand(0, count($promoCodes) - 1)];
                $promoCode->setUsed(true);
                $order->setPromoCode($promoCode);
                $product->setPromoCount($product->getPromoCount() - 1);
                $em->persist($promoCode);
            }

            $history = (new History())
                ->setOrders($order)
                ->setUser($user);

            $em->persist($user);
            $em->persist($product);
            $em->persist($order);
            $em->persist($history);

            $em->flush();
            $connect->commit();
        } catch (\Exception $e) {
            $connect->rollback();

            if ($e->getCode() === 100) {
                return $this->createResponse(['msg' => 'Нет в наличии'], false);
            }

            throw $e;
        }

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $order = $serializerHelper
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($order, 'json', ['groups' => ['Orders', 'Promo', 'Products']]);

        return $this->createResponse([
           'order' => $order
        ]);
    }

    /**
     * @Route("/api/orders/{orderId}/message/send", methods={"POST"}, name="api_orders_message")
     * @param int $orderId
     * @param OrdersRepository $ordersRep
     * @param VKAPI $vk
     * @return JsonResponse
     */
    public function purchaseNotificationSend(int $orderId, OrdersRepository $ordersRep, VKAPI $vk)
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
     * @param HistoryRepository $historyRep
     * @param ValidatorInterface $validator
     * @param SerializerHelper $serializer
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function getHistory(
        int $userId,
        HistoryRepository $historyRep,
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

        $history = $historyRep->get($userId, $params['page'] ?? 1);

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $history = $serializer
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($history, 'json', ['groups' => ['History', 'Orders', 'Points', 'Products']]);

        return $this->createResponse($history);
    }
}