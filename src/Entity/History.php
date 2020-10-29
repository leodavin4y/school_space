<?php

namespace App\Entity;

use App\Repository\HistoryRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=HistoryRepository::class)
 */
class History
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"History"})
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity=Points::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"History"})
     */
    private $points;

    /**
     * @ORM\ManyToOne(targetEntity=Orders::class)
     * @ORM\JoinColumn(nullable=true)
     * @Groups({"History"})
     */
    private $orders;

    /**
     * @ORM\Column(type="datetime")
     * @Groups({"History"})
     */
    private $created_at;

    /**
     * @ORM\ManyToOne(targetEntity=Users::class)
     * @ORM\JoinColumn(nullable=false, name="user_id", referencedColumnName="user_id")
     * @Groups({"History"})
     */
    private $user;

    public function __construct()
    {
        $this->setCreatedAt(new \DateTime());
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPoints(): ?Points
    {
        return $this->points;
    }

    public function setPoints(?Points $points): self
    {
        $this->points = $points;

        return $this;
    }

    public function getOrders(): ?Orders
    {
        return $this->orders;
    }

    public function setOrders(?Orders $orders): self
    {
        $this->orders = $orders;

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

    public function setUser(Users $user): self
    {
        $this->user = $user;

        return $this;
    }
}
