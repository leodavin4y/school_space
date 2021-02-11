<?php

namespace App\Command;

use App\Repository\UsersRepository;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\Users;
use App\Service\VKAPI;
use App\Service\Letscover;
use App\Service\CommandLock;

class SyncDB extends Command
{
    protected static $defaultName = 'app:sync-db';

    private $em;

    private $usersRep;

    private $commandLock;

    public function __construct(
        EntityManagerInterface $entityManager,
        UsersRepository $usersRep,
        CommandLock $commandLock,
        ?string $name = null
    ) {
        parent::__construct($name);

        $this->em = $entityManager;
        $this->usersRep = $usersRep;
        $this->commandLock = $commandLock;
    }

    protected function configure()
    {
        // ...
    }

    private function userIds($users)
    {
        $userIds = [];

        foreach ($users as $item) {
            $userIds[] = $item->userId;
        }

        return array_unique($userIds);
    }

    private function findFromProfiles($userId, array $profiles)
    {
        foreach ($profiles as $profile) {
            if ($profile->id == $userId) return $profile;
        }

        return null;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        if ($this->commandLock->isLocked()) return Command::FAILURE;

        $userActivities = Letscover::getActivity();
        $userActivitiesChunked = array_chunk($userActivities, 500);
        $recordedUsers = 0;

        echo 'Letscover users: ' . count($userActivities) . PHP_EOL;

        foreach ($userActivitiesChunked as $usersChunk) {
            $profiles = VKAPI::usersGet($this->userIds($usersChunk));

            echo 'Request: ' . count($usersChunk). ' response: ' . count($profiles) . PHP_EOL;

            foreach ($usersChunk as $item) {
                $profile = $this->findFromProfiles($item->userId, $profiles);

                try {
                    if (is_null($profile)) {
                        $profile = VKAPI::usersGet($item->userId)[0] ?? null;
                        if (is_null($profile)) throw new \Exception('Error user_id = ' . $item->userId . ' not found');
                        sleep(1);
                    }

                    $user = $this->usersRep->find($item->userId);

                    if (!$user) {
                        $user = new Users();
                        $user->setUserId($item->userId);
                    }

                    $user->setFirstName($item->firstName)
                        ->setLastName($item->lastName)
                        ->setPhoto100($profile->photo_100)
                        ->setBalance($item->points);

                    $this->em->persist($user);
                    $this->em->flush();

                    $recordedUsers++;
                } catch (\Exception $e) {
                    echo $e->getMessage() . PHP_EOL;
                }
            }
        }

        echo 'Users stored: ' . $recordedUsers . PHP_EOL;

        return Command::SUCCESS;
    }
}