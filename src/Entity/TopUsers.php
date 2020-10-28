<?php

namespace App\Entity;

use App\Repository\TopUsersRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=TopUsersRepository::class)
 */
class TopUsers
{

    /**
     * @ORM\Column(type="integer")
     * @Groups({"TopUsers"})
     */
    private $rank;

    /**
     * @ORM\Id
     * @ORM\Column(type="integer", nullable=true)
     * @Groups({"TopUsers"})
     */
    private $user_id;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"TopUsers"})
     */
    private $points;

    public function getRank(): ?int
    {
        return $this->rank;
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

    public function getPoints(): ?int
    {
        return $this->points;
    }

    public function setPoints(int $points): self
    {
        $this->points = $points;

        return $this;
    }

}
