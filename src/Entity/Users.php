<?php

namespace App\Entity;

use App\Repository\UsersRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=UsersRepository::class)
 */
class Users
{

    /**
     * @ORM\Id
     * @ORM\Column(type="integer", nullable=false)
     * @Groups({"Students"})
     */
    private $user_id;

    /**
     * @ORM\Column(type="string", length=255, nullable=true, options={"default" : null})
     * @Groups({"Students"})
     */
    private $city;

    /**
     * @ORM\Column(type="string", length=255, nullable=true, options={"default" : null})
     * @Groups({"Students"})
     */
    private $school;

    /**
     * @ORM\Column(type="smallint", nullable=true, options={"default" : null})
     * @Groups({"Students"})
     */
    private $class;

    /**
     * @ORM\Column(type="string", length=255, nullable=true, options={"default" : null})
     * @Groups({"Students"})
     */
    private $teacher;

    /**
     * @ORM\OneToMany(targetEntity=Points::class, mappedBy="student", orphanRemoval=true)
     */
    private $points;

    /**
     * @ORM\Column(type="integer", options={"default" : 0})
     * @Groups({"Students"})
     */
    private $balance = 0;

    /**
     * @ORM\Column(type="decimal", precision=7, scale=2, options={"default" : 0, "unsigned"=true})
     * @Groups({"Students"})
     */
    private $talent = 0;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"Students"})
     */
    private $photo_100 = 'https://vk.com/images/camera_100.png?ava=1';

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"Students"})
     */
    private $first_name;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"Students"})
     */
    private $last_name;

    /**
     * @ORM\Column(type="boolean", options={"default" : 0})
     * @Groups({"Students"})
     */
    private $ban = 0;

    public function __construct()
    {
        $this->points = new ArrayCollection();
    }

    public function getUserId(): int
    {
        return $this->user_id;
    }

    public function setUserId(int $user_id): self
    {
        $this->user_id = $user_id;

        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(?string $city): self
    {
        $this->city = $city;

        return $this;
    }

    public function getSchool(): ?string
    {
        return $this->school;
    }

    public function setSchool(?string $school): self
    {
        $this->school = $school;

        return $this;
    }

    public function getClass(): ?int
    {
        return $this->class;
    }

    public function setClass(?int $class): self
    {
        $this->class = $class;

        return $this;
    }

    public function setTeacher(?string $teacher): self
    {
        $this->teacher = $teacher;

        return $this;
    }

    public function getTeacher(): ?string
    {
        return $this->teacher;
    }

    /**
     * @return Collection|Points[]
     */
    public function getPoints(): Collection
    {
        return $this->points;
    }

    public function addPoints(Points $points): self
    {
        if (!$this->points->contains($points)) {
            $this->points[] = $points;
            $points->setUser($this);
        }

        return $this;
    }

    public function removePoints(Points $points): self
    {
        if ($this->points->contains($points)) {
            $this->points->removeElement($points);
            // set the owning side to null (unless already changed)
            if ($points->getUser() === $this) {
                $points->setUser(null);
            }
        }

        return $this;
    }

    public function getBalance(): ?int
    {
        return $this->balance;
    }

    public function setBalance(int $balance): self
    {
        $this->balance = $balance;

        return $this;
    }

    public function getTalent(): float
    {
        return $this->talent;
    }

    public function setTalent(float $talent): self
    {
        $this->talent = $talent;

        return $this;
    }

    public function getPhoto100(): ?string
    {
        return $this->photo_100;
    }

    public function setPhoto100(string $photo_100): self
    {
        $this->photo_100 = $photo_100;

        return $this;
    }

    public function getFirstName(): ?string
    {
        return $this->first_name;
    }

    public function setFirstName(string $first_name): self
    {
        $this->first_name = $first_name;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->last_name;
    }

    public function setLastName(string $last_name): self
    {
        $this->last_name = $last_name;

        return $this;
    }

    public function getBan(): ?bool
    {
        return $this->ban;
    }

    public function setBan(bool $ban): self
    {
        $this->ban = $ban;

        return $this;
    }

}
