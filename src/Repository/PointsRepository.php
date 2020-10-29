<?php

namespace App\Repository;

use App\Entity\Points;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\Expr;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\Query\ResultSetMapping;
use Doctrine\ORM\Query;

/**
 * @method Points|null find($id, $lockMode = null, $lockVersion = null)
 * @method Points|null findOneBy(array $criteria, array $orderBy = null)
 * @method Points[]    findAll()
 * @method Points[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PointsRepository extends ServiceEntityRepository
{

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Points::class);
    }

    public function noVerifyCount()
    {
        return $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->where('p.verify = :val')
            ->setParameter('val', false)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function getAllByParams(array $params, $page = 1)
    {
        $predicate = [];

        foreach ($params as $key => $val) {
            $predicate[] = 'p.' . $key . ' = :' . $key;
        }

        // build the query for the doctrine paginator
        $query = $this->createQueryBuilder('p')
            ->where(implode(' AND ', $predicate));

        foreach ($params as $key => $val) {
            $query->setParameter($key, $val);
        }

        $query->orderBy('p.id', 'DESC')->getQuery();

        //set page size
        $pageSize = '5';

        // load doctrine Paginator
        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        // you can get total items
        $totalItems = count($paginator);

        // get total pages
        $pagesCount = ceil($totalItems / $pageSize);

        // now get one page's items:
        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page-1)) // set the offset
            ->setMaxResults($pageSize) // set the limit
            ->getResult(Query::HYDRATE_SIMPLEOBJECT);
    }

    public function getPointsByCurMonth($userId)
    {
        $em = $this->getEntityManager();
        $emConfig = $em->getConfiguration();

        $emConfig->addCustomDatetimeFunction('YEAR', 'DoctrineExtensions\Query\Mysql\Year');
        $emConfig->addCustomDatetimeFunction('MONTH', 'DoctrineExtensions\Query\Mysql\Month');
        $emConfig->addCustomDatetimeFunction('DAY', 'DoctrineExtensions\Query\Mysql\Day');
        $emConfig->addCustomDatetimeFunction('NOW', 'DoctrineExtensions\Query\Mysql\Now');

        return $this->createQueryBuilder('p')
            ->select()
            ->where('p.student_id = :user_id AND MONTH(p.date_at) = MONTH(NOW()) AND YEAR(p.date_at) = YEAR(NOW())')
            ->setParameter('user_id', $userId)
            ->orderBy('p.date_at', 'DESC')
            ->getQuery()
            ->getArrayResult();
    }

    public function getOneByDateAt($userId, $dateAt)
    {
        return $this->createQueryBuilder('p')
            ->select()
            ->where('p.student_id = :user_id AND p.date_at = :date_at')
            ->setParameter('user_id', $userId)
            ->setParameter('date_at', $dateAt)
            ->getQuery()
            ->getResult();
    }

    /**
     * @param int $page
     * @param int $itemsPerPage
     * @return mixed[]
     * @throws \Doctrine\DBAL\DBALException
     */
    public function getTopUsers(int $page, $itemsPerPage = 10)
    {

        /*$offset = --$page * $itemsPerPage;
        $conn = $this->getEntityManager()->getConnection();
        $conn->query("SET @row_number = 0;");

        $stmt = $conn->prepare("
            SELECT tt.*, u.first_name, u.last_name, u.photo_100 FROM (
                SELECT (@row_number := @row_number + 1) AS `rank`, t.user_id, t.amount, t.created_at FROM (
                    SELECT p.student_id as user_id, SUM(p.amount) as amount, MIN(p.created_at) as created_at
                      FROM points as p
                        WHERE MONTH(p.created_at) = MONTH(CURRENT_DATE()) AND verify = 1
                      GROUP BY p.student_id
                ) as t ORDER BY t.amount DESC, t.created_at ASC
            ) as tt
                JOIN users as u ON u.user_id = tt.user_id
                  ORDER BY tt.rank ASC
            LIMIT {$itemsPerPage} OFFSET {$offset}
        ");

        $stmt->execute();
        $results = $stmt->fetchAll(\PDO::FETCH_OBJ);

        if (is_array($results)) {
            foreach ($results as $key => $result) {
                $results[$key]->user_id = intval($result->user_id);
                $results[$key]->amount = intval($result->amount);
                $results[$key]->rank = intval($result->rank);
            }
        }

        return $results;*/
    }

    /**
     * @param int $uid
     * @param int $page
     * @param int $itemsPerPage
     * @return mixed[]
     * @throws \Doctrine\DBAL\DBALException
     */
    public function getTopUsersWithUser(int $uid, int $page = 1, $itemsPerPage = 4)
    {
        $min = $page - 1;
        $max = $min + $itemsPerPage;
        $conn = $this->getEntityManager()->getConnection();
        $conn->query("SET @row_number = 0;");

        $stmt = $conn->prepare("
            SELECT tt.*, u.first_name, u.last_name, u.photo_100 FROM (
                SELECT (@row_number := @row_number + 1) AS `rank`, t.user_id, t.amount, t.created_at FROM (
                    SELECT p.student_id as user_id, SUM(p.amount) as amount, MIN(p.created_at) as created_at
                      FROM points as p
                        WHERE p.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH) AND verify = 1
                      GROUP BY p.student_id
                ) as t ORDER BY t.amount DESC, t.created_at ASC
            ) as tt
              JOIN users as u ON u.user_id = tt.user_id
                WHERE tt.rank > {$min} AND tt.rank <= {$max} OR tt.user_id = ?
        ");

        $stmt->execute([$uid]);
        $results = $stmt->fetchAll(\PDO::FETCH_OBJ);

        if (is_array($results)) {
            foreach ($results as $key => $result) {
                $results[$key]->user_id = intval($result->user_id);
                $results[$key]->amount = intval($result->amount);
                $results[$key]->rank = intval($result->rank);
            }
        }

        return $results;
    }

    /*public function getAll($wherePredicates, $page = 1)
    {
        // build the query for the doctrine paginator
        $query = $this->createQueryBuilder('p')
            ->where($wherePredicates)
            ->orderBy('p.id', 'DESC')
            ->getQuery();

        //set page size
        $pageSize = '10';

        // load doctrine Paginator
        $paginator = new \Doctrine\ORM\Tools\Pagination\Paginator($query);

        // you can get total items
        $totalItems = count($paginator);

        // get total pages
        $pagesCount = ceil($totalItems / $pageSize);

        // now get one page's items:
        return $paginator
            ->getQuery()
            ->setFirstResult($pageSize * ($page-1)) // set the offset
            ->setMaxResults($pageSize) // set the limit
            ->getResult(Query::HYDRATE_SIMPLEOBJECT);
    }*/

    /*public function getCount()
    {
        $conn = $this->getEntityManager()
            ->getConnection();

        $stmt = $conn->prepare('SELECT count(*) as num_rows FROM `points` WHERE verify = ?');
        $stmt->execute([0]);

        return $stmt->fetch()['num_rows'];
    }*/

    /**
     * @param $userId
     * @param \DateTime $month
     * @return int
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function getTotalPointsPerMonth($userId, \DateTime $month)
    {
        $config = $this->getEntityManager()->getConfiguration();
        $config->addCustomDatetimeFunction('MONTH', 'DoctrineExtensions\Query\Mysql\Month');
        $config->addCustomDatetimeFunction('YEAR', 'DoctrineExtensions\Query\Mysql\Year');

        $total = $this->createQueryBuilder('p')
            ->select('SUM(p.amount) as total')
            ->where('p.student_id = :userId AND p.verify = 1 AND MONTH(p.date_at) = MONTH(:date) AND YEAR(p.date_at) = YEAR(:date)')
            ->groupBy('p.student_id')
            ->setParameter('userId', $userId)
            ->setParameter('date', $month->format('Y-m-d'))
            ->getQuery()
            ->getOneOrNullResult();

        return is_array($total) ? (int) $total['total'] : 0;
    }

    public function reportMaxPointsPerDay($userId)
    {
        $em = $this->getEntityManager();
        $emConfig = $em->getConfiguration();
        $emConfig->addCustomDatetimeFunction('DATE', 'DoctrineExtensions\Query\Mysql\Date');

        $result = $this->createQueryBuilder('p')
            ->select('SUM(p.amount) as amount, DATE(p.created_at) as created_at')
            ->where('p.student_id = :userId AND p.verify = 1')
            ->groupBy('created_at')
            ->orderBy('amount', 'DESC')
            ->setMaxResults(1)
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getOneOrNullResult();

        if (!is_null($result)) $result['amount'] = intval($result['amount']);

        return $result;
    }

    public function reportMaxPointsPerMonth($userId)
    {
        $em = $this->getEntityManager();
        $emConfig = $em->getConfiguration();
        $emConfig->addCustomDatetimeFunction('DATE', 'DoctrineExtensions\Query\Mysql\Date');

        $result = $this->createQueryBuilder('p')
            ->select('SUM(p.amount) as amount, MONTH(p.created_at) as month_num')
            ->where('p.student_id = :userId AND p.verify = 1')
            ->groupBy('month_num')
            ->orderBy('amount', 'DESC')
            ->setMaxResults(1)
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getOneOrNullResult();

        if (!is_null($result)) {
            $result['amount'] = intval($result['amount']);
            $result['month_num'] = (int) $result['month_num'];
        }

        return $result;
    }

    /**
     * @param int $userId
     * @param int $excludePointId
     * @return mixed
     * @throws \Doctrine\ORM\NonUniqueResultException
     */
    public function sumUpAllPoints(int $userId, int $excludePointId): int
    {
        $result = $this->createQueryBuilder('p')
            ->select('SUM(p.amount) as total')
            ->where('p.student_id = :user_id AND p.verify = 1 AND p.cancel = 0 AND p.id != :exclude_id')
            ->setParameter('user_id', $userId)
            ->setParameter('exclude_id', $excludePointId)
            ->getQuery()
            ->getOneOrNullResult();

        return $result['total'] ?? 0;
    }

   /* public function get($offset = 0)
    {
        $conn = $this->getEntityManager()
            ->getConnection();

        $stmt = $conn->prepare("
            SELECT p.*, s.* FROM `points` as p
              JOIN students as s ON p.student_id = s.user_id 
            LIMIT 10 OFFSET {$offset}
        ");

        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_OBJ);
    }*/

}
