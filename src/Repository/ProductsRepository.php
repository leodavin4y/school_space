<?php

namespace App\Repository;

use App\Entity\Products;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @method Products|null find($id, $lockMode = null, $lockVersion = null)
 * @method Products|null findOneBy(array $criteria, array $orderBy = null)
 * @method Products[]    findAll()
 * @method Products[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ProductsRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Products::class);
    }

    function findByEnabled($enabled = null)
    {
        $query = $this->createQueryBuilder('p')
            ->select();

        if (is_null($enabled)) {
            return $query->orderBy('p.id', 'DESC')
                ->getQuery()
                ->getResult();
        }

        return $query
            ->where('p.enabled = :enabled AND (p.promo_count > 0 OR p.promo_count IS NULL)')
            ->orderBy('p.num', 'ASC')
            ->addOrderBy('p.id', 'DESC')
            ->setParameter('enabled', $enabled)
            ->getQuery()
            ->getResult();
    }
}
