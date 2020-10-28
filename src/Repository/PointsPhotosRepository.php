<?php

namespace App\Repository;

use App\Entity\PointsPhotos;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method PointsPhotos|null find($id, $lockMode = null, $lockVersion = null)
 * @method PointsPhotos|null findOneBy(array $criteria, array $orderBy = null)
 * @method PointsPhotos[]    findAll()
 * @method PointsPhotos[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PointsPhotosRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PointsPhotos::class);
    }

    // /**
    //  * @return PointsPhotos[] Returns an array of PointsPhotos objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('p.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?PointsPhotos
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */

    public function getPhotos($pointId)
    {
        $conn = $this->getEntityManager()
            ->getConnection();

        $stmt = $conn->prepare("
            SELECT `id` as `photo_id`, `name` FROM `points_photos`
              WHERE point_id = ?
        ");

        $stmt->execute([
            $pointId
        ]);

        return $stmt->fetchAll(\PDO::FETCH_OBJ);
    }
}
