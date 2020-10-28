<?php

namespace App\Entity;

use App\Repository\OrdersRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=OrdersRepository::class)
 */
class Orders
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"Orders"})
     */
    private $id;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"Orders"})
     */
    private $user_id;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"Orders"})
     */
    private $product_id;

    /**
     * @ORM\Column(type="datetime")
     * @Groups({"Orders"})
     */
    private $created_at;

    /**
     * @ORM\ManyToOne(targetEntity=Users::class)
     * @ORM\JoinColumn(nullable=false, name="user_id", referencedColumnName="user_id")
     * @Groups({"Orders"})
     */
    private $user;

    /**
     * @ORM\ManyToOne(targetEntity=Products::class)
     * @ORM\JoinColumn(nullable=false, name="product_id", referencedColumnName="id")
     * @Groups({"Orders"})
     */
    private $product;

    /**
     * @ORM\ManyToOne(targetEntity=PromoCodes::class)
     * @Groups({"Orders"})
     */
    private $promo_code;

    /**
     * @ORM\Column(type="boolean", options={"default" : 0})
     */
    private $completed = 0;

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
    
    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeInterface $created_at): self
    {
        $this->created_at = $created_at;

        return $this;
    }

    public function getUser(): ?Users
    {
        return $this->user;
    }

    public function setUser(?Users $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getProduct(): ?Products
    {
        return $this->product;
    }

    public function setProduct(?Products $product): self
    {
        $this->product = $product;

        return $this;
    }

    public function getPromoCode(): ?PromoCodes
    {
        return $this->promo_code;
    }

    public function setPromoCode(?PromoCodes $promo_code): self
    {
        $this->promo_code = $promo_code;

        return $this;
    }

    public function getCompleted(): ?bool
    {
        return $this->completed;
    }

    public function setCompleted(bool $completed): self
    {
        $this->completed = $completed;

        return $this;
    }
}
