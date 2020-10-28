<?php

namespace App\Entity;

use App\Repository\PromoCodesRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=PromoCodesRepository::class)
 */
class PromoCodes
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"Promo"})
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=32)
     * @Groups({"Promo"})
     */
    private $code;

    /**
     * @ORM\ManyToOne(targetEntity=Products::class, inversedBy="promoCodes")
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"Promo"})
     */
    private $product;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"Promo"})
     */
    private $used = false;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

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

    public function getUsed(): ?bool
    {
        return $this->used;
    }

    public function setUsed(bool $used): self
    {
        $this->used = $used;

        return $this;
    }
}
