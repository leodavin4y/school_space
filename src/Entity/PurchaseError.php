<?php

namespace App\Entity;

use App\Repository\PurchaseErrorRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints\DateTime;

/**
 * @ORM\Entity(repositoryClass=PurchaseErrorRepository::class)
 */
class PurchaseError
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"PurchaseError"})
     */
    private $id;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"PurchaseError"})
     */
    private $user_id;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"PurchaseError"})
     */
    private $product_id;

    /**
     * @ORM\Column(type="datetime")
     * @Groups({"PurchaseError"})
     */
    private $created_at;

    /**
     * @ORM\ManyToOne(targetEntity=Users::class)
     * @ORM\JoinColumn(nullable=false, name="user_id", referencedColumnName="user_id")
     * @Groups({"PurchaseError"})
     */
    private $user;

    /**
     * @ORM\ManyToOne(targetEntity=Products::class)
     * @ORM\JoinColumn(nullable=false, name="product_id", referencedColumnName="id")
     * @Groups({"PurchaseError"})
     */
    private $product;

    public function __construct()
    {
        $this->created_at = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserId(): ?int
    {
        return $this->user_id;
    }

    public function setUserId(int $user_id): self
    {
        $this->user_id = $user_id;

        return $this;
    }

    public function getProductId(): ?int
    {
        return $this->product_id;
    }

    public function setProductId(int $product_id): self
    {
        $this->product_id = $product_id;

        return $this;
    }

    public function getUser(): ?Users
    {
        return $this->user;
    }

    public function setUser(?Users $user): self
    {
        $this->user = $user;
        $this->user_id = $user->getUserId();

        return $this;
    }

    public function getProduct(): ?Products
    {
        return $this->product;
    }

    public function setProduct(?Products $product): self
    {
        $this->product = $product;
        $this->product_id = $product->getId();

        return $this;
    }
}
