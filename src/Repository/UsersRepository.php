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
        /*$query =  $this->createQueryBuilder('u')
            ->select('u.user_id, u.city, u.school, u.class, u.teacher, u.balance, u.talent, u.first_name, u.last_name, u.photo_100, t.rank')
            ->leftJoin(TopUsers::class, 't', 'WITH', 't.user_id = u.user_id')
            ->where('u.first_name LIKE :regExp OR u.last_name LIKE :regExp')
            ->orderBy('t.rank', 'DESC')
            ->setParameter('regExp', "{$query}%")
            ->getQuery();

        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page - 1))
            ->setMaxResults($pageSize)
            ->getResult();*/

        $offset = $pageSize * ($page - 1);
        $db = $this->getEntityManager()
            ->getConnection();

        $stmt = $db->prepare(
            "SELECT DISTINCT 
                    u.user_id, u.city, u.school, u.class, u.teacher, u.balance, u.talent, u.first_name, u.last_name, u.photo_100, t.rank 
                  FROM users as u 
                    LEFT JOIN top_users as t ON t.user_id = u.user_id 
                      WHERE CONCAT(u.first_name, ' ', u.last_name) LIKE :regExp
                    ORDER BY u.user_id, t.rank
                    LIMIT {$pageSize} OFFSET {$offset}"
        );
        $stmt->execute([':regExp' => "%{$query}%"]);

        return $stmt->fetchAll();
    }

    public function findBannedByName($query, $page = 1, $pageSize = 20)
    {
        /*$query =  $this->createQueryBuilder('u')
            ->select('u.user_id, u.city, u.school, u.class, u.teacher, u.balance, u.talent, u.first_name, u.last_name, u.photo_100, u.ban, t.rank')
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
            ->getResult();*/

        $offset = $pageSize * ($page - 1);
        $db = $this->getEntityManager()
            ->getConnection();

        $stmt = $db->prepare(
            "SELECT DISTINCT 
                    u.user_id, u.city, u.school, u.class, u.teacher, u.balance, u.talent, u.first_name, u.last_name, u.photo_100, t.rank 
                  FROM users as u 
                    LEFT JOIN top_users as t ON t.user_id = u.user_id 
                      WHERE u.ban = 1 AND CONCAT(u.first_name, ' ', u.last_name) LIKE :regExp
                    ORDER BY u.user_id, t.rank
                    LIMIT {$pageSize} OFFSET {$offset}"
        );
        $stmt->execute([':regExp' => "%{$query}%"]);

        return $stmt->fetchAll();
    }

    public function calcTalents()
    {
        $db = $this->getEntityManager()
            ->getConnection();

        $db->query("UPDATE `users` SET `talent` = ROUND(`balance` / 50, 2) WHERE `balance` > 0");
    }

    public function wipeBalances()
    {
        return $this->createQueryBuilder('u')
            ->update()
            ->set('u.balance', 0)
            ->getQuery()
            ->execute();
    }
}
