<?php

namespace App\Repository;

use App\Entity\PurchaseError;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method PurchaseError|null find($id, $lockMode = null, $lockVersion = null)
 * @method PurchaseError|null findOneBy(array $criteria, array $orderBy = null)
 * @method PurchaseError[]    findAll()
 * @method PurchaseError[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PurchaseErrorRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PurchaseError::class);
    }

    // /**
    //  * @return PurchaseError[] Returns an array of PurchaseError objects
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
    public function findOneBySomeField($value): ?PurchaseError
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
