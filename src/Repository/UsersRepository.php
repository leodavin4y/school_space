<?php

namespace App\Repository;

use App\Entity\Users;
use App\Entity\TopUsers;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Users|null find($id, $lockMode = null, $lockVersion = null)
 * @method Users|null findOneBy(array $criteria, array $orderBy = null)
 * @method Users[]    findAll()
 * @method Users[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UsersRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Users::class);
    }

    public function findByName($query, $page = 1, $pageSize = 20)
    {
        $query =  $this->createQueryBuilder('u')
            ->select('u.user_id, u.city, u.school, u.class, u.teacher, u.balance, u.first_name, u.last_name, u.photo_100, t.rank')
            ->leftJoin(TopUsers::class, 't', 'WITH', 't.user_id = u.user_id')
            ->where('u.first_name LIKE :regExp OR u.last_name LIKE :regExp')
            ->orderBy('t.rank', 'DESC')
            ->setParameter('regExp', "%{$query}%")
            ->getQuery();

        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page - 1))
            ->setMaxResults($pageSize)
            ->getResult();
    }

    public function findBannedByName($query, $page = 1, $pageSize = 20)
    {
        $query =  $this->createQueryBuilder('u')
            ->select('u.user_id, u.city, u.school, u.class, u.teacher, u.balance, u.first_name, u.last_name, u.photo_100, u.ban, t.rank')
            ->leftJoin(TopUsers::class, 't', 'WITH', 't.user_id = u.user_id')
            ->where('u.ban = 1 AND (u.first_name LIKE :regExp OR u.last_name LIKE :regExp)')
            ->orderBy('t.rank', 'DESC')
            ->setParameter('regExp', "%{$query}%")
            ->getQuery();

        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page - 1))
            ->setMaxResults($pageSize)
            ->getResult();
    }
}
