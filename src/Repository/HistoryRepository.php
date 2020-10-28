<?php

namespace App\Repository;

use App\Entity\History;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method History|null find($id, $lockMode = null, $lockVersion = null)
 * @method History|null findOneBy(array $criteria, array $orderBy = null)
 * @method History[]    findAll()
 * @method History[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class HistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, History::class);
    }

    public function get(int $userId, int $page, int $pageSize = 10)
    {
        $query = $this->createQueryBuilder('h')
            ->select()
            ->where('h.user = :user_id')
            ->orderBy('h.id', 'DESC')
            ->setParameter('user_id', $userId)
            ->getQuery();

        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page - 1)) // Offset
            ->setMaxResults($pageSize)                          // Limit
            ->getResult();
    }
}
