<?php

namespace App\Repository;

use App\Entity\Points;
use App\Entity\Users;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\Common\Collections\Criteria;

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

    public function coinsToTalents($userIds = [])
    {
        $list = implode(', ', $userIds);
        $db = $this->getEntityManager()->getConnection();
        $db->query("
          UPDATE `users` 
              SET `talent` = `talent` + ROUND(`balance` / 50, 2), 
                  `balance` = 0 
            WHERE `balance` > 0 AND user_id IN ({$list})
        ");
    }

    public function wipeBalances()
    {
        return $this->createQueryBuilder('u')
            ->update()
            ->set('u.balance', 0)
            ->getQuery()
            ->execute();
    }

    /**
     * Получить пользователей с положительным балансом с разбивкой на страницы
     *
     * @param int $page
     * @param int $itemPerPage
     * @return Users[]
     */
    public function getByLimit(int $page = 1, int $itemPerPage = 10)
    {
        $offset = $itemPerPage * ($page - 1);

        return $this->createQueryBuilder('u')
            ->select('u')
            ->where('u.ban = 0 AND u.balance > 0')
            ->getQuery()
            ->setFirstResult($offset) // set the offset
            ->setMaxResults($itemPerPage) // set the limit
            ->getSQL();
            //->getResult();
    }

    public function getUsersCount()
    {
        $this->matching(Criteria::create()->andWhere(Criteria::expr()->eq('ban', false)))->count();
    }

    public function getTop($count = 3): array
    {
        return $this->createQueryBuilder('u')
            ->select('u')
            ->where('u.ban = 0')
            ->orderBy('u.balance', 'DESC')
            ->getQuery()
            ->setMaxResults($count)
            ->getResult();
    }
}
