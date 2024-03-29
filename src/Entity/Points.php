<?php

namespace App\Entity;

use App\Repository\PointsRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Entity\Users;

/**
 * @ORM\Entity(repositoryClass=PointsRepository::class)
 */
class Points
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"Points"})
     */
    private $id;

    /**
     * @ORM\Column(type="integer")
     * @Groups({"Points"})
     */
    private $student_id;

    /**
     * @ORM\Column(type="date")
     * @Groups({"Points"})
     */
    private $date_at;

    /**
     * @ORM\Column(type="integer", options={"default": 0})
     * @Groups({"Points"})
     */
    private $amount = 0;

    /**
     * @ORM\Column(type="boolean")
     * @Groups({"Points"})
     */
    private $verify = false;

    /**
     * @ORM\ManyToOne(targetEntity=Users::class, inversedBy="points")
     * @ORM\JoinColumn(name="student_id", referencedColumnName="user_id", nullable=false)
     * @var Users|null
     * @Groups({"Points"})
     */
    private $user;

    /**
     * @ORM\OneToMany(targetEntity=PointsPhotos::class, mappedBy="point")
     * @Groups({"Points"})
     */
    private $photos;

    /**
     * @ORM\Column(type="boolean", options={"default": 0})
     * @Groups({"Points"})
     */
    private $cancel = 0;

    /**
     * @ORM\Column(type="datetime")
     * @Groups({"Points"})
     */
    private $created_at;

    /**
     * @ORM\Column(type="string", length=255, nullable=true)
     * @Groups({"Points"})
     */
    private $cancel_comment;

    public function __construct()
    {
        $this->photos = new ArrayCollection();
        $this->created_at = new \DateTime();
    }

    public function toArray() {
        return get_object_vars($this);
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    /**
     *
     * @return int|null
     */
    public function getStudentId(): ?int
    {
        return $this->student_id;
    }

    public function setStudentId(int $student_id): self
    {
        $this->student_id = $student_id;

        return $this;
    }

    public function getDateAt(): ?\DateTimeInterface
    {
        return $this->date_at;
    }

    public function setDateAt(\DateTimeInterface $date_at): self
    {
        $this->date_at = $date_at;

        return $this;
    }

    public function getAmount(): ?int
    {
        return $this->amount;
    }

    public function setAmount(int $amount = 0): self
    {
        $this->amount = $amount;

        return $this;
    }

    /**
     * @return \App\Entity\Users|null
     */
    public function getUser(): ?Users
    {
        return $this->user;
    }

    /**
     * @param \App\Entity\Users|null $user
     * @return Points
     */
    public function setUser(?Users $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getVerify(): ?bool
    {
        return $this->verify;
    }

    public function setVerify(bool $verify = false): self
    {
        $this->verify = $verify;

        return $this;
    }

    /**
     * @return Collection|PointsPhotos[]
     */
    public function getPhotos(): Collection
    {
        return $this->photos;
    }

    public function addPhoto(PointsPhotos $pointsPhoto): self
    {
        if (!$this->photos->contains($pointsPhoto)) {
            $this->photos[] = $pointsPhoto;
            $pointsPhoto->setPoint($this);
        }

        return $this;
    }

    public function removePhoto(PointsPhotos $pointsPhoto): self
    {
        if ($this->photos->contains($pointsPhoto)) {
            $this->photos->removeElement($pointsPhoto);
            // set the owning side to null (unless already changed)
            if ($pointsPhoto->getPoint() === $this) {
                $pointsPhoto->setPoint(null);
            }
        }

        return $this;
    }

    public function getCancel(): ?bool
    {
        return $this->cancel;
    }

    public function setCancel(bool $cancel): self
    {
        $this->cancel = $cancel;

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

    public function getCancelComment(): ?string
    {
        return $this->cancel_comment;
    }

    public function setCancelComment(?string $cancel_comment): self
    {
        $this->cancel_comment = $cancel_comment;

        return $this;
    }
}
