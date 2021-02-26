<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Service\Letscover;
use App\Service\SerializerHelper;
use App\Service\Utils;
use App\Repository\UsersRepository;
use App\Repository\ProductsRepository;
use App\Repository\OrdersRepository;
use App\Entity\History;
use App\Entity\Orders;
use App\Entity\PurchaseError;

class ProductsController extends BaseApiController {

    public function __construct(RequestStack $requestStack, ValidatorInterface $validator, UsersRepository $usersRep)
    {
        parent::__construct($requestStack, $validator, $usersRep);
    }

    /**
     * Получить массив продуктов для магазина
     *
     * @Route("/api/products/get", methods={"POST"}, name="api_products_get")
     * @param ProductsRepository $productsRep
     * @param ValidatorInterface $validator
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function getProducts(ProductsRepository $productsRep, ValidatorInterface $validator): JsonResponse
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
     * Покупка продукта
     *
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

        $promoExist = $product->getPromoCount() && $product->getPromoCount() > 0;
        $promoCodes = $promoExist ? $product->getUnusedPromoCodes() : [];

        if ($product->getRemaining() <= 0 || ($promoExist && count($promoCodes) === 0)) {
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
            try {
                // Сняли стоимость товара с баланса пользователя в нашей БД
                $user->setBalance($user->getBalance() - $product->getPrice());

                $product->setRemaining($product->getRemaining() - 1);
                $order = (new Orders())
                    ->setUser($user)
                    ->setProduct($product)
                    ->setCreatedAt(new \DateTime());

                if ($promoExist) {
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
            } catch (\Exception $e) {
                throw new \Exception($e->getMessage(), 1);
            }

            // Сняли стоимость товара с баланса пользователя в БД let'scover
            $sendToApi = Letscover::subBalance($user->getUserId(), $product->getPrice());
            if (!$sendToApi) throw new \Exception('Failed to set letscover balance', 2);

            $em->flush();
            $connect->commit();
        } catch (\Exception $e) {
            $connect->rollback();

            // Произошла ошибка ПОСЛЕ изменения баланса let's cover - надо вернуть баланс let's cover
            if ($e->getCode() !== 1) {
                $sendToApi = Letscover::addBalance($user->getUserId(), $product->getPrice());

                if (!$sendToApi) {
                    $error = (new PurchaseError())
                        ->setUser($user)
                        ->setProduct($product);

                    $em->persist($error);
                    $em->flush();
                }
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

}