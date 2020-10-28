<?php

namespace App\Entity;

use App\Repository\PointsPhotosRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * @ORM\Entity(repositoryClass=PointsPhotosRepository::class)
 */
class PointsPhotos
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     * @Groups({"PointsPhotos"})
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     * @Groups({"PointsPhotos"})
     */
    private $name;

    /**
     * @ORM\ManyToOne(targetEntity=Points::class, inversedBy="pointsPhotos")
     * @ORM\JoinColumn(nullable=false)
     * @Groups({"PointsPhotos"})
     */
    private $point;

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

    public function getPoint(): ?Points
    {
        return $this->point;
    }

    public function setPoint(?Points $point): self
    {
        $this->point = $point;

        return $this;
    }
}
