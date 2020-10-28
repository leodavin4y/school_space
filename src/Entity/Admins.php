<?php

namespace App\Entity;

use App\Repository\AdminsRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=AdminsRepository::class)
 */
class Admins
{

    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @Groups({"Admins"})
     */
    private $user_id;

    /**
     * @ORM\OneToOne(targetEntity=Users::class, cascade={"persist", "remove"})
     * @ORM\JoinColumn(nullable=false, name="user_id", referencedColumnName="user_id")
     * @Groups({"Admins"})
     */
    private $user;

    public function getUserId(): ?int
    {
        return $this->user_id;
    }

    public function setUserId(int $user_id): self
    {
        $this->user_id = $user_id;

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
