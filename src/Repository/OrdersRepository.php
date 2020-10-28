<?php

namespace App\Repository;

use App\Entity\Orders;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Orders|null find($id, $lockMode = null, $lockVersion = null)
 * @method Orders|null findOneBy(array $criteria, array $orderBy = null)
 * @method Orders[]    findAll()
 * @method Orders[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class OrdersRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Orders::class);
    }

    public function getLastOrder(int $userId)
    {
        return $this->createQueryBuilder('o')
            ->select()
            ->where('o.user_id = :user_id AND o.created_at >= :date')
            ->setParameter('date', new \DateTime('-1 month'))
            ->orderBy('o.id','DESC')
            ->setMaxResults(1)
            ->setParameter('user_id', $userId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findAllByCompleted(bool $isCompleted, int $page = 1, int $pageSize = 5)
    {
        $query = $this->createQueryBuilder('o')
            ->select()
            ->where('o.completed = :is_completed')
            ->orderBy('o.id', 'DESC')
            ->setParameter('is_completed', $isCompleted)
            ->getQuery();

        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page - 1)) // Offset
            ->setMaxResults($pageSize)                          // Limit
            ->getResult();
    }

    public function getOrdersCountInInterval(int $userId, int $productId, int $timeInSeconds)
    {
        $time = new \DateTime(date('Y-m-d H:i:s', (new \DateTime())->getTimestamp() - $timeInSeconds));

        // SELECT COUNT(*) FROM `orders` WHERE user_id = 271016769 AND product_id = 1 AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) GROUP BY user_id
        $result = $this->createQueryBuilder('o')
            ->select('COUNT(o.id) as orders_count')
            ->where('o.user_id = :user_id AND o.product_id = :prod_id AND o.created_at >= :time')
            ->groupBy('o.user_id')
            ->setParameter('user_id', $userId)
            ->setParameter('prod_id', $productId)
            ->setParameter('time', $time)
            ->getQuery()
            ->getOneOrNullResult();

        return is_null($result) ? 0 : (int) $result['orders_count'];
    }

    public function calcFreqRemaining(int $userId, int $productId, int $freq_time, int $freq)
    {
        $time = (new \DateTime())->getTimestamp() - $freq_time;

        $db = $this->getEntityManager()->getConnection();
        $stmt = $db->prepare("
            SELECT {$freq_time} - (UNIX_TIMESTAMP() - UNIX_TIMESTAMP(t.created_at)) as result FROM (
                SELECT * FROM `orders` as o
                  WHERE o.user_id = ? AND o.product_id = ? AND UNIX_TIMESTAMP(o.created_at) >= {$time} 
                    ORDER BY o.id DESC LIMIT {$freq} OFFSET 0
            ) as t ORDER BY t.id ASC LIMIT 1 OFFSET 0
        ");

        $stmt->execute([$userId, $productId]);

        $result = $stmt->fetch();

        return $result ? $result['result'] : 0;
    }

}
