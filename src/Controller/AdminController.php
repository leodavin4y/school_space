<?php

namespace App\Controller;

use App\Entity\Products;
use App\Entity\PromoCodes;
use App\Entity\Users;
use App\Kernel;
use App\Repository\AdminsRepository;
use App\Repository\OrdersRepository;
use App\Repository\ProductsRepository;
use App\Repository\PromoCodesRepository;
use App\Repository\TopUsersRepository;
use App\Repository\UsersRepository;
use App\Service\UploadFiles;
use App\Service\Utils;
use App\Service\VKAPI;
use App\Service\Letscover;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use App\Service\SerializerHelper;
use App\Entity\Admins;
use App\Entity\Points;
use App\Entity\PointsPhotos;
use App\Repository\PointsRepository;
use Doctrine\Common\Collections\Criteria;

/**
 * Админка для управления данными приложения
 * Class AdminController
 * @package App\Controller
 */
class AdminController extends BaseApiController {

    /**
     * @var EntityManagerInterface
     */
    private $em;

    /**
     * @var Admins|null
     */
    private $admin;

    public function __construct(
        EntityManagerInterface $em,
        RequestStack $requestStack,
        ValidatorInterface $validator,
        UsersRepository $usersRep,
        AdminsRepository $adminRep
    ) {
        parent::__construct($requestStack, $validator, $usersRep);

        $this->em = $em;

        if ($_ENV['ADMIN_VK_ID'] != $this->uid) {
            $this->admin = $adminRep->find($this->uid);

            if (!$this->admin) throw new HttpException(403, 'Forbidden');
        }
    }

    /**
     * Вход в админку
     *
     * @Route("/admin/login", methods={"POST"}, name="admin_login")
     *
     * @param PointsRepository $pointsRep
     * @param OrdersRepository $ordersRep
     * @return JsonResponse
     */
    public function login(PointsRepository $pointsRep, OrdersRepository $ordersRep)
    {
        $pointsWaiting = $pointsRep->noVerifyCount();
        $purchasesCount = $ordersRep->count([]);

        return $this->createResponse([
            'points_no_verify' => $pointsWaiting,
            'purchases' => $purchasesCount,
            'service_token' => $_ENV['SERVICE_TOKEN']
        ]);
    }

    /**
     * Регистрация нового админа
     *
     * @Route("/admin/register", methods={"POST"}, name="admin_register")
     *
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     * @param VKAPI $vk
     * @return JsonResponse
     * @throws \Exception
     */
    public function register(ValidatorInterface $validator, UsersRepository $usersRep, VKAPI $vk)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'user_id' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                ]
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $user = $usersRep->find($params['user_id']);

        if (!$user) {
            $profile = $vk->usersGet($params['user_id'])[0];

            $user = new Users();
            $user->setUserId($params['user_id']);
            $user->setPhoto100($profile->photo_100);
            $user->setFirstName($profile->first_name);
            $user->setLastName($profile->last_name);
        }

        $admin = new Admins();
        $admin->setUserId($params['user_id']);
        $admin->setUser($user);

        $this->em->persist($user);
        $this->em->persist($admin);

        $this->em->flush();

        return $this->createResponse();
    }

    /**
     * Разжалование админа
     *
     * @Route("/admin/admins/{id}/demote", methods={"POST"}, name="admin_demote")
     *
     * @param int $id
     * @param AdminsRepository $adminsRep
     * @return JsonResponse
     */
    public function demote(int $id, AdminsRepository $adminsRep)
    {
        $admin = $adminsRep->find($id);

        if (!$admin) throw new HttpException(422, 'Admin not found');
        if (!$adminsRep->remove($admin)) throw new HttpException(422, 'Failed to remove admin');

        return $this->createResponse();
    }

    /**
     * Получение оценок для интерфейса управления оценками
     *
     * @Route("/admin/points/get", methods={"POST"}, name="admin_get_points")
     *
     * @param ValidatorInterface $validator
     * @param PointsRepository $pointsRep
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function points(ValidatorInterface $validator, PointsRepository $pointsRep)
    {
        $constraints = new Assert\Collection([
            'fields' => [
                'verify' => [
                    new Assert\Type('bool'),
                ],
                'cancel' => [
                    new Assert\Type('bool'),
                ],
                'page' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1
                    ])
                ]
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($this->postJson, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $where = [
            'verify' => $this->postJson['verify'],
            'cancel' => $this->postJson['cancel']
        ];

        $points = $pointsRep->getAllByParams($where, intval($this->postJson['page']));
        $result = [];

        /**
         * @param \DateTime $inner
         * @return int
         */
        $converter = function($inner) {
            return $inner->getTimestamp() * 1000;
        };
        $serializer = (new SerializerHelper())
            ->convertField('date_at', $converter)
            ->convertField('created_at', $converter)
            ->getSerializer();

        foreach ($points as $key => $point) {
            $result[] = $serializer->normalize($point, 'json', ['groups' => [
                'Points',
                'PointsPhotos',
                'Students'
            ]]);
        }

        return $this->createResponse([
            'reviews' => $result
        ]);
    }

    /**
     * Обработка присланной заявки на проверку оценок.
     * Установить или изменить оценку
     *
     * @Route("/admin/points/{action}", methods={"POST"}, name="admin_set_points", requirements={"action"="^(set|update){1}$"}, defaults={"action": "set"})
     *
     * @param string $action
     * @param ValidatorInterface $validator
     * @param PointsRepository $pointsRep
     * @param VKAPI $vk
     * @throws \Exception
     * @return JsonResponse
     */
    public function setPoints(string $action, ValidatorInterface $validator, PointsRepository $pointsRep, VKAPI $vk): JsonResponse
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'id' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                ],
                'amount' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range(['min' => 0])
                ],
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $point = $pointsRep->find($params['id']);

        if (!$point) throw new HttpException(422, 'Point not found');

        $user = $point->getUser();
        $em = $this->em;
        $connect = $em->getConnection();
        $connect->beginTransaction();

        try {
            if ($action === 'set') {
                $user->setBalance($user->getBalance() + $params['amount']);
                $sendToApi = Letscover::addBalance($user->getUserId(), $params['amount']);

                if (!$sendToApi) throw new \Exception('Failed to set letscover balance');
            } else {
                $balance = $user->getBalance() - $point->getAmount();
                $balance = $balance + $params['amount'];
                $user->setBalance($balance > 0 ? $balance : 0);
            }

            $point->setAmount($params['amount']);
            $point->setVerify(1);

            $em->persist($point);
            $em->persist($user);

            $em->flush();
            $connect->commit();

            if ($action === 'set') {
                try {
                    $vk->sendMsg(
                        $user->getUserId(),
                        "Ваша заявка на получение умникоинов за оценки #{$params['id']} одобрена!\n\n" .
                        '+ ' . Utils::declOfNum($params['amount'], ['%d умникоин', '%d умникоина', '%d умникоинов']) . "\n" .
                        "Баланс: {$user->getBalance()}"
                    );
                } catch (\Exception $e) {}
            }
        } catch (\Exception $e) {
            $connect->rollBack();
            throw $e;
        }

        return $this->createResponse([
            'id' => $point->getId()
        ]);
    }

    /**
     * Отклонить заявку на проверку оценок.
     *
     * @Route("/admin/points/{id}/cancel", methods={"POST"}, name="admin_cancel_points")
     *
     * @param int $id
     * @param ValidatorInterface $validator
     * @param PointsRepository $pointsRep
     * @param VKAPI $vk
     * @return JsonResponse
     */
    public function cancelPoints(int $id, ValidatorInterface $validator, PointsRepository $pointsRep, VKAPI $vk): JsonResponse
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'comment' => [
                    new Assert\NotBlank(),
                    new Assert\Type('string'),
                    new Assert\Length([
                        'min' => 1,
                        'max' => 255
                    ])
                ]
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $point = $pointsRep->find($id);

        if (!$point) throw new HttpException(422, 'Point not found');

        $point->setCancel(1);
        $point->setCancelComment($params['comment']);

        $this->em->persist($point);
        $this->em->flush();

        try {
            $vk->sendMsg(
                $point->getUser()->getUserId(),
                "Ваша заявка на получение умникоинов за оценки #{$id} отклонена\n\n" .
                "Комментарий администратора: «{$params['comment']}»‎\n\n" .
                "Вы можете попытаться отправить оценки заново"
            );
        } catch (\Exception $e) {}

        return $this->createResponse([
            'id' => $point->getId()
        ]);
    }

    /**
     * Поиск пользователей/админов/забаненных по имени (с пагинацией)
     *
     * @Route("/admin/{type}/search", methods={"POST"}, name="admin_users_search", requirements={"type"="^(users|admins|banned){1}$"}, defaults={"type": "admins"})
     *
     * @param string $type
     * @param AdminsRepository $adminsRep
     * @param UsersRepository $usersRep
     * @param SerializerHelper $serializer
     * @param ValidatorInterface $validator
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function searchUsers(
        string $type,
        AdminsRepository $adminsRep,
        UsersRepository $usersRep,
        SerializerHelper $serializer,
        ValidatorInterface $validator
    ) {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'search' => [
                    new Assert\Type('string'),
                ],
                'page' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1
                    ])
                ])
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $users = [];

        if ($type === 'admins') {
            $admins = $adminsRep->findAll();

            foreach ($admins as $admin) {
                $users[] = $admin->getUser();
            }
        }

        if ($type === 'users') {
            $users = $usersRep->findByName($params['search'], $params['page'] ?? 1);
        }

        if ($type === 'banned') {
            $users = $usersRep->findBannedByName($params['search'], $params['page'] ?? 1);
        }

        $users = $serializer
            ->getSerializer()
            ->normalize($users, 'json', ['groups' => ['Students', 'Admins', 'TopUsers']]);

        return $this->createResponse($users);
    }

    /**
     * Удаление администратора
     *
     * @Route("/admin/users/{userId}/delete", methods={"POST"}, name="admin_users_delete")
     *
     * @param int $userId
     * @param AdminsRepository $adminsRep
     * @return JsonResponse
     */
    public function deleteUser(int $userId, AdminsRepository $adminsRep)
    {
        $admin = $adminsRep->find($userId);

        if (!$admin) throw new HttpException(422, 'User not found');

        $this->em->remove($admin);
        $this->em->flush();

        return $this->createResponse();
    }

    /**
     * Получение счетчика админов/юзеров/забаненных
     *
     * @Route("/admin/users/count", methods={"POST"}, name="admin_users_count")
     *
     * @param AdminsRepository $adminsRep
     * @param UsersRepository $usersRep
     * @return JsonResponse
     */
    public function usersCount(AdminsRepository $adminsRep, UsersRepository $usersRep)
    {
        $usersCount = $usersRep->matching(Criteria::create())->count();
        $adminsCount = $adminsRep->matching(Criteria::create())->count();
        $bannedCount = $usersRep->matching(Criteria::create()->andWhere(Criteria::expr()->eq('ban', true)))->count();

        return $this->createResponse([
            'admins' => $adminsCount,
            'users' => $usersCount,
            'banned' => $bannedCount
        ]);
    }

    /**
     * Забанить пользователя
     *
     * @Route("/admin/users/{id}/{banAction}", methods={"POST"}, name="admin_ban_user", requirements={"banAction"="^(ban|unban){1}$"}, defaults={"banAction": "ban"})
     *
     * @param int $id
     * @param string $banAction
     * @param UsersRepository $usersRep
     * @return JsonResponse
     */
    public function banUser(int $id, string $banAction, UsersRepository $usersRep)
    {
        $user = $usersRep->find($id);

        if (!$user) throw new HttpException(422, 'User not found');

        $user->setBan($banAction === 'ban');

        $this->em->persist($user);
        $this->em->flush();

        return $this->createResponse();
    }

    /**
     * Удалить товар
     *
     * @Route("/admin/products/{id}/delete", methods={"POST"}, name="admin_products_delete")
     *
     * @param int $id
     * @param ProductsRepository $productsRep
     * @param Kernel $kernel
     * @return JsonResponse
     */
    public function productDelete(int $id, ProductsRepository $productsRep, Kernel $kernel)
    {
        $product = $productsRep->find($id);

        if (!$product) throw new HttpException(422, 'Product not found');

        $this->em->remove($product);
        $this->em->flush();

        @unlink($kernel->getProjectDir() . '/var/upload/products/' . $product->getPhoto());

        return $this->createResponse();
    }

    /**
     * Скрыть/показать товар в магазине
     *
     * @Route("/admin/products/{id}/{seen}", methods={"POST"}, name="admin_products_disable", requirements={"seen"="^(disable|enable){1}$"}, defaults={"seen": "disable"})
     *
     * @param int $id
     * @param string $seen
     * @param ProductsRepository $productsRep
     * @return JsonResponse
     */
    public function productSeen(int $id, string $seen, ProductsRepository $productsRep)
    {
        $product = $productsRep->find($id);

        if (!$product) throw new HttpException(422, 'Product not found');

        $product->setEnabled($seen === 'enable');

        $this->em->persist($product);
        $this->em->flush();

        return $this->createResponse();
    }

    /**
     * Создать/изменить товар
     *
     * @Route("/admin/product/{action}", name="admin_product_store", requirements={"action"="^(store|update){1}$"}, defaults={"action": "store"})
     *
     * @param string $action
     * @param ValidatorInterface $validator
     * @param UploadFiles $uploadFiles
     * @param Kernel $kernel
     * @param ProductsRepository $productsRep
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function productStore(
        string $action,
        ValidatorInterface $validator,
        UploadFiles $uploadFiles,
        Kernel $kernel,
        ProductsRepository $productsRep
    ) {
        $params = $this->request->request->all();
        $file = $this->request->files->get('photo');

        $constraints = new Assert\Collection([
            'fields' => [
                'id' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ]),
                'name' => [
                    new Assert\NotBlank(),
                    new Assert\Type('string'),
                    new Assert\Length([
                        'max' => 255
                    ])
                ],
                'description' => [
                    new Assert\NotBlank(),
                    new Assert\Type('string'),
                ],
                'price' => [
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ],
                'remaining' => [
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ],
                'enabled' => [
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ],
                'num' => [
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ],
                'restrict_freq' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ]),
                'restrict_freq_time' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type(['string', 'digit']),
                ])
            ],
            'allowExtraFields' => true
        ]);

        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $product = new Products();

        if ($action === 'update') {
            if (!isset($params['id'])) throw new HttpException(422, 'Validation error');

            $product = $productsRep->find($params['id']);

            if (is_null($product)) throw new HttpException(422, 'Product not found');
        }

        $uploadedFiles = [];

        if (!is_null($file) && $file instanceof UploadedFile) {
            try {
                $files = [$file];
                $uploadedFiles = $uploadFiles
                    ->setUploadDir('/var/upload/products')
                    ->setFiles($files)
                    ->processFiles();
            } catch (\Exception $e) {
                throw new HttpException(500, $e->getMessage());
            }
        }

        $product->setName($params['name'])
            ->setDescription($params['description'])
            ->setPrice(abs(intval($params['price'])))
            ->setRemaining(abs(intval($params['remaining'])))
            ->setEnabled(boolval(intval($params['enabled'])))
            ->setNum(abs(intval($params['num'])))
            ->setRestrictFreq($params['restrict_freq'] ?? null)
            ->setRestrictFreqTime($params['restrict_freq'] ?? null);

        if (count($uploadedFiles) > 0) {
            if ($product->getPhoto()) {
                @unlink($kernel->getProjectDir() . '/var/upload/products/' . $product->getPhoto());
            }

            $product->setPhoto($uploadedFiles[0]->getFilename());
        }

        $this->em->persist($product);
        $this->em->flush();

        $product = (new SerializerHelper())->getSerializer()
            ->normalize($product, 'json', ['groups' => 'Products']);

        return $this->createResponse([
            'product' => $product
        ]);
    }

    /**
     * Получить список промокодов
     *
     * @Route("/admin/products/{productId}/promo-codes/get", name="admin_promo-codes_get")
     *
     * @param int $productId
     * @param ProductsRepository $productsRep
     * @param SerializerHelper $serializerHelper
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function getPromoCodes(int $productId, ProductsRepository $productsRep, SerializerHelper $serializerHelper)
    {
        $product = $productsRep->find($productId);

        if (!$product) throw new HttpException(422, 'Product not found');

        $promoCodes = $serializerHelper->getSerializer()
            ->normalize($product->getPromoCodes(), 'json', ['groups' => ['Promo']]);

        return $this->createResponse($promoCodes);
    }

    /**
     * Удалить промокод у продукта
     *
     * @Route("/admin/products/{productId}/promo-codes/{promoCodeId}/delete", name="admin_promo-codes_delete")
     *
     * @param int $productId
     * @param int $promoCodeId
     * @param ProductsRepository $productsRep
     * @param PromoCodesRepository $promoCodesRep
     * @return JsonResponse
     */
    public function promoCodeDelete(int $productId, int $promoCodeId, ProductsRepository $productsRep, PromoCodesRepository $promoCodesRep)
    {
        $product = $productsRep->find($productId);

        if (!$product) throw new HttpException(422, 'Product not found');

        $promo = $promoCodesRep->getPromoByProduct($promoCodeId, $productId);

        if (!$promo) throw new HttpException(422, 'Promo not found');

        $promo->setUsed(true);
        $product->setPromoCount($product->getPromoCount() - 1);

        $this->em->persist($promo);
        $this->em->persist($product);
        $this->em->flush();

        return $this->createResponse();
    }

    /**
     * Создать промокод для продукта
     *
     * @Route("/admin/products/{productId}/promo-codes/store", name="admin_promo-codes_store")
     *
     * @param int $productId
     * @param ProductsRepository $productsRep
     * @param ValidatorInterface $validator
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function promoCodeStore(int $productId, ProductsRepository $productsRep, ValidatorInterface $validator)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'code' => [
                    new Assert\NotBlank(),
                    new Assert\Type('string'),
                    new Assert\Length([
                        'min' => 1,
                        'max' => 32
                    ])
                ],
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $product = $productsRep->find($productId);

        if (!$product) throw new HttpException(422, 'Product not found');

        $promo = (new PromoCodes())
            ->setProduct($product)
            ->setCode($params['code']);

        $product->setPromoCount(intval($product->getPromoCount()) + 1);

        $this->em->persist($promo);
        $this->em->persist($product);

        $this->em->flush();

        $promo = (new SerializerHelper())
            ->getSerializer()
            ->normalize($promo, 'json', ['groups' => ['Promo', 'Products']]);

        return $this->createResponse([
            'promo' => $promo
        ]);
    }

    /**
     * Получить список новых/обработанных заказов
     *
     * @Route("/admin/orders/{type}/get", name="admin_orders_get", requirements={"type"="^(active|processed){1}$"}, defaults={"type": "active"})
     *
     * @param string $type
     * @param OrdersRepository $ordersRep
     * @param SerializerHelper $serializerHelper
     * @param ValidatorInterface $validator
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function ordersGet(string $type, OrdersRepository $ordersRep, SerializerHelper $serializerHelper, ValidatorInterface $validator)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'page' => new Assert\Optional([
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1,
                    ])
                ]),
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $orders = $ordersRep->findAllByCompleted($type === 'processed', $params['page'] ?? 1);

        /**
         * @param \DateTime $inner
         * @return int
         */
        $converter = function($inner) {
            return $inner->getTimestamp() * 1000;
        };
        $orders = $serializerHelper
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($orders, 'json', [
                'groups' => ['Orders', 'Students', 'Products', 'Promo']
            ]);

        return $this->createResponse([
            'orders' => $orders
        ]);
    }

    /**
     * Пометить заказ как обработанный
     *
     * @Route("/admin/orders/{id}/complete", name="admin_orders_complete")
     *
     * @param int $id
     * @param OrdersRepository $ordersRep
     * @return JsonResponse
     */
    public function orderComplete(int $id, OrdersRepository $ordersRep)
    {
        $order = $ordersRep->find($id);

        if (!$order) throw new HttpException(422, 'Order not found');

        $order->setCompleted(true);

        $this->em->persist($order);
        $this->em->flush();

        return $this->createResponse();
    }

    /**
     * Установить/изменить баланс пользователя
     *
     * @Route("/admin/users/{userId}/balance/set", name="admin_user_balance_set")
     *
     * @param int $userId
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     * @return JsonResponse
     * @throws \Exception
     */
    public function userSetBalance(int $userId, ValidatorInterface $validator, UsersRepository $usersRep)
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'balance' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 0,
                    ])
                ]
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $user = $usersRep->find($userId);

        if (!$user) throw new HttpException(422, 'User not found');

        if ($params['balance'] === $user->getBalance()) return $this->createResponse();

        $connect = $this->getDoctrine()->getConnection();
        $connect->beginTransaction();

        try {
            $user->setBalance($params['balance']);

            $point = new Points();
            $point->setVerify(1)
                ->setDateAt(new \DateTime())
                ->setUser($user)
                ->setAutogenerated(true)
                ->setAmount($params['balance'] - $user->getBalance()); // Может быть отрицательным числом

            $this->em->persist($user);
            $this->em->persist($point);

            $this->em->flush();
            $connect->commit();
        } catch (\Exception $e) {
            $connect->rollback();

            throw $e;
        }

        return $this->createResponse();
    }
}