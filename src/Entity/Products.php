<?php

namespace App\Entity;

use App\Repository\ProductsRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=ProductsRepository::class)
 */
class Products
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"Products"})
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"Products"})
     */
    private $name;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"Products"})
     */
    private $description;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"Products"})
     */
    private $photo;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"Products"})
     */
    private $price;

    /**
     * @ORM\Column(type="integer", nullable=false)
     * @Groups({"Products"})
     */
    private $remaining = 0;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"Products"})
     */
    private $enabled;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"Products"})
     */
    private $num = 0;

    /**
     * @ORM\Column(type="integer", nullable=true, options={"default" : null})
     */
    private $promo_count = null;

    /**
     * @ORM\OneToMany(targetEntity=PromoCodes::class, mappedBy="product")
     */
    private $promoCodes;

    /**
     * Как часто один и тот же юзер может купить этот товар (в секундах)
     * @ORM\Column(type="integer", nullable=true, options={"default" : null})
     * @Groups({"Products"})
     */
    private $restrict_freq;

    /**
     * @ORM\Column(type="integer", nullable=true, options={"default" : null})
     * @Groups({"Products"})
     */
    private $restrict_freq_time;

    public function __construct()
    {
        $this->promoCodes = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    public function setPhoto(?string $photo): self
    {
        $this->photo = $photo;

        return $this;
    }

    public function getPrice(): ?int
    {
        return $this->price;
    }

    public function setPrice(int $price): self
    {
        $this->price = $price;

        return $this;
    }

    public function getRemaining(): ?int
    {
        return $this->remaining;
    }

    public function setRemaining(int $remaining): self
    {
        $this->remaining = $remaining;

        return $this;
    }

    public function getEnabled(): ?bool
    {
        return $this->enabled;
    }

    public function setEnabled(bool $enabled): self
    {
        $this->enabled = $enabled;

        return $this;
    }

    public function getNum(): ?int
    {
        return $this->num;
    }

    public function setNum(int $num): self
    {
        $this->num = $num;

        return $this;
    }

    public function getPromoCount(): ?int
    {
        return $this->promo_count;
    }

    public function setPromoCount(?int $promoCount): self
    {
        $this->promo_count = $promoCount;

        return $this;
    }

    /**
     * @return Collection|PromoCodes[]
     */
    public function getPromoCodes(): Collection
    {
        return $this->promoCodes;
    }

    /**
     * @return Collection|PromoCodes[]
     */
    public function getUnusedPromoCodes(): Collection
    {
        $codes = $this->getPromoCodes();
        $result = new ArrayCollection();

        foreach ($codes as $code) {
            if ($code->getUsed()) continue;
            $result->add($code);
        }

        return $result;
    }

    public function addPromoCode(PromoCodes $promoCode): self
    {
        if (!$this->promoCodes->contains($promoCode)) {
            $this->promoCodes[] = $promoCode;
            $promoCode->setProduct($this);
        }

        return $this;
    }

    public function removePromoCode(PromoCodes $promoCode): self
    {
        if ($this->promoCodes->contains($promoCode)) {
            $this->promoCodes->removeElement($promoCode);
            // set the owning side to null (unless already changed)
            if ($promoCode->getProduct() === $this) {
                $promoCode->setProduct(null);
            }
        }

        return $this;
    }

    public function getRestrictFreq(): ?int
    {
        return $this->restrict_freq;
    }

    public function setRestrictFreq(?int $restrict_freq): self
    {
        $this->restrict_freq = $restrict_freq;

        return $this;
    }

    public function getRestrictFreqTime(): ?int
    {
        return $this->restrict_freq_time;
    }

    public function setRestrictFreqTime(?int $restrict_freq_time): self
    {
        $this->restrict_freq_time = $restrict_freq_time;

        return $this;
    }

}
