<?php

namespace App\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Users;
use App\Entity\Points;
use App\Entity\PointsPhotos;
use App\Service\VKAPI;

class CreateRandUsers extends Command
{
    // the name of the command (the part after "bin/console")
    protected static $defaultName = 'app:create-rand-user';

    private $em;

    public function __construct(EntityManagerInterface $entityManager, ?string $name = null)
    {
        parent::__construct($name);

        $this->em = $entityManager;
    }

    protected function configure()
    {
        // ...
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $em = $this->em;
        $randomIds = [];

        for ($i = 0; $i < 1000; $i++) $randomIds[] = mt_rand(1, 999999999);

        $profiles = VKAPI::usersGet(implode(',', $randomIds), ['city', 'photo_100']);
        $letters = ['А', 'Б', 'В', 'Г'];

        foreach ($profiles as $profile) {
            if ($profile->deactivated ?? false) continue;

            $student = (new Users())
                ->setUserId($profile->id)
                ->setPhoto100($profile->photo_100)
                ->setFirstName($profile->first_name)
                ->setLastName($profile->last_name)
                ->setCity($profile->city->title ?? 'Moscow')
                ->setSchool(mt_rand(1, 9999))
                ->setClass(mt_rand(1, 11));

            $em->persist($student);

            $point = (new Points())
                ->setUser($student)
                ->setDateAt(new \DateTime());

            if ($this->chance(33)) {
                $point->setVerify(true)->setAmount(mt_rand(1, 99));
            } elseif ($this->chance(33)) {
                $point->setCancel(true);
            } else {}

            $em->persist($point);

            $photosCount = mt_rand(1, 10);

            for ($i = 0; $i < $photosCount; $i++) {
                $pointPhoto = new PointsPhotos();
                $pointPhoto->setPoint($point)->setName('https://via.placeholder.com/500?text=Photo_' . ($i + 1));

                $em->persist($pointPhoto);
            }

            $em->flush();
        }

        // ... put here the code to run in your command

        // this method must return an integer number with the "exit status code"
        // of the command. You can also use these constants to make code more readable

        // return this if there was no problem running the command
        // (it's equivalent to returning int(0))
        return Command::SUCCESS;

        // or return this if some error happened during the execution
        // (it's equivalent to returning int(1))
        // return Command::FAILURE;
    }

    protected function chance($percent)
    {
        return rand(0, 100) < $percent;
    }
}