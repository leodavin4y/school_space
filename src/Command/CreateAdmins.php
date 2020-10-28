<?php

namespace App\Command;

use App\Repository\AdminsRepository;
use App\Repository\UsersRepository;
use App\Entity\Users;
use App\Entity\Admins;
use App\Service\VKAPI;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;

class CreateAdmins extends Command
{
    // the name of the command (the part after "bin/console")
    protected static $defaultName = 'app:create-admins';

    private $em;

    private $usersRep;

    private $adminsRep;

    private $vk;

    public function __construct(
        EntityManagerInterface $entityManager,
        UsersRepository $usersRep,
        AdminsRepository $adminsRep,
        VKAPI $vk,
        ?string $name = null
    )
    {
        parent::__construct($name);

        $this->em = $entityManager;
        $this->usersRep = $usersRep;
        $this->adminsRep = $adminsRep;
        $this->vk = $vk;
    }

    protected function createUser(int $userId)
    {
        $admin = $this->adminsRep->find($userId);
        $user = $this->usersRep->find($userId);

        if ($admin && $user) return true;

        if (!$user) {
            $profile = $this->vk->usersGet($userId)[0];

            $user = new Users();
            $user->setUserId($userId);
            $user->setPhoto100($profile->photo_100);
            $user->setFirstName($profile->first_name);
            $user->setLastName($profile->last_name);
        }

        $admin = new Admins();
        $admin->setUserId($userId);
        $admin->setUser($user);

        $this->em->persist($user);
        $this->em->persist($admin);

        $this->em->flush();
    }

    protected function configure(){}

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $admins = [271016769, 35645976];

        foreach ($admins as $adminId) {
            $this->createUser($adminId);
        }

        return Command::SUCCESS;
    }
}