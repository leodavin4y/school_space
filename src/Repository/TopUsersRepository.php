<?php

namespace App\Repository;

use App\Entity\TopUsers;
use App\Entity\Users;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\Query;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method TopUsers|null find($id, $lockMode = null, $lockVersion = null)
 * @method TopUsers|null findOneBy(array $criteria, array $orderBy = null)
 * @method TopUsers[]    findAll()
 * @method TopUsers[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TopUsersRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TopUsers::class);
    }

    // /**
    //  * @return TopUsers[] Returns an array of TopUsers objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('t.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?TopUsers
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */

    public function getByIds($userIds)
    {
        return $this->createQueryBuilder('t')
            ->select('t.user_id, t.points, u.first_name, u.last_name, u.photo_100')
            ->where('t.user_id IN (:ids)')
            ->join(Users::class, 'u', 'WITH', 'u.user_id = t.user_id')
            ->orderBy('t.rank', 'ASC')
            ->setParameter('ids', $userIds, \Doctrine\DBAL\Connection::PARAM_STR_ARRAY)
            ->getQuery()
            ->getResult();
    }

    /**
     * @param int $page = 1
     * @param int $itemPerPage = 4
     * @return array
     */
    public function getMostActive(int $page = 1, int $itemPerPage = 4): array
    {
        $min = --$page * $itemPerPage;
        $max = $min + $itemPerPage;

        return $this->createQueryBuilder('t')
            ->select('t.rank, t.user_id, t.points, u.first_name, u.last_name, u.photo_100')
            ->where('t.rank <= :max AND t.rank > :min')
            ->innerJoin(Users::class, 'u', 'WITH', 'u.user_id = t.user_id')
            ->orderBy('t.rank', 'ASC')
            ->setParameter('min', $min)
            ->setParameter('max', $max)
            ->getQuery()
            ->getResult();
    }

    /**
     * @param int $userId
     * @return mixed
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function getUser(int $userId)
    {
        return $this->createQueryBuilder('t')
            ->select('t.rank, t.user_id, t.points, u.first_name, u.last_name, u.photo_100')
            ->where('t.user_id = :user_id')
            ->innerJoin(Users::class, 'u', 'WITH', 'u.user_id = t.user_id')
            ->setParameter('user_id', $userId)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
