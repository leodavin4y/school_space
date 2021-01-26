<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Service\VKAPI;
use App\Service\Letscover;
use App\Service\SerializerHelper;
use App\Repository\UsersRepository;
use App\Repository\TopUsersRepository;
use App\Entity\Users;

class UsersController extends BaseApiController {

    public function __construct(RequestStack $requestStack, ValidatorInterface $validator, UsersRepository $usersRep)
    {
        parent::__construct($requestStack, $validator, $usersRep);
    }

    /**
     * Сохранить профиль школьника
     *
     * @Route("/api/profile/store", methods={"POST"}, name="api_profile_store")
     * @param ValidatorInterface $validator
     * @param UsersRepository $usersRep
     * @return JsonResponse
     * @throws \Exception
     */
    public function profileStore(ValidatorInterface $validator, UsersRepository $usersRep): JsonResponse
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'city' => [
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                    new Assert\Length([
                        'min' => 2,
                        'max' => 255
                    ])
                ],
                'school' => [
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                    new Assert\Length([
                        'min' => 1,
                        'max' => 30
                    ])
                ],
                'class' => [
                    new Assert\NotBlank,
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1,
                        'max' => 11
                    ])
                ],
                'teacher' => [
                    new Assert\NotBlank,
                    new Assert\Type('string'),
                    new Assert\Length(['max' => 255, 'min' => 10])
                ],
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        $params = (object) $params;
        $uid = $this->uid;
        $em = $this->getDoctrine()->getManager();
        $student = $usersRep->find($uid);

        if (!$student) $student = new Users();

        $profile = VKAPI::usersGet($uid)[0];

        $student->setUserId($uid)
            ->setFirstName($profile->first_name)
            ->setLastName($profile->last_name)
            ->setPhoto100($profile->photo_100)
            ->setCity($params->city)
            ->setSchool($params->school)
            ->setClass($params->class)
            ->setTeacher($params->teacher);

        $em->persist($student);
        $em->flush();

        Letscover::addBalance($uid, 0);

        return $this->createResponse();
    }

    /**
     * Получить профиль пользователя
     *
     * @Route("/api/profile/get", methods={"POST"}, name="api_profile_get")
     * @param UsersRepository $usersRep
     * @return JsonResponse
     * @throws \Doctrine\Common\Annotations\AnnotationException
     * @throws \Symfony\Component\Serializer\Exception\ExceptionInterface
     */
    public function profileGet(UsersRepository $usersRep): JsonResponse
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        /**
         * @param \DateTime $inner
         * @return int - timestamp in ms
         */
        $converter = function($inner) {return $inner->getTimestamp() * 1000;};
        $user = (new SerializerHelper())
            ->convertField('date_at', $converter)
            ->convertField('created_at', $converter)
            ->getSerializer()
            ->normalize($usersRep->find($this->uid), 'json', ['groups' => ['Students']]);

        return $this->createResponse([
            'user' => $user
        ]);
    }

    /**
     * Проверить наличие заполненного профиля
     *
     * @Route("/api/profile/exist", methods={"POST"}, name="api_profile_exist")
     * @param UsersRepository $usersRep
     * @return JsonResponse
     */
    public function profileCheckExist(UsersRepository $usersRep)
    {
        if (is_null($this->uid)) throw new HttpException(403, 'Access forbidden. Expected param: vk_user_id');

        $student = $usersRep->find($this->uid);

        return $this->createResponse([
            'exist' => !is_null($student) &&
                !is_null($student->getCity()) &&
                !is_null($student->getSchool()) &&
                !is_null($student->getClass()) &&
                !is_null($student->getTeacher())
        ]);
    }

    /**
     * Получить список самых активных пользователей
     *
     * @Route("/api/users", name="api_users")
     * @param ValidatorInterface $validator
     * @param TopUsersRepository $topUsersRep
     * @return JsonResponse
     */
    public function topUsers(ValidatorInterface $validator, TopUsersRepository $topUsersRep): JsonResponse
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'page' => [
                    new Assert\NotBlank(),
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1,
                    ])
                ],
            ],
            'allowExtraFields' => true
        ]);
        $errors = $validator->validate($params, $constraints);

        if (count($errors) > 0) throw new HttpException(422, 'Validation error');

        return $this->createResponse($topUsersRep->getMostActive($params['page'], 10));
    }

    /**
     * Получить рейтинг друзей в таблице самых активных пользователей
     * по массиву идентификаторов друзей для страницы "Статистика"
     *
     * @Route("/api/friends/get", methods={"POST"}, name="api_friends_get")
     * @param ValidatorInterface $validator
     * @param TopUsersRepository $topUsersRep
     * @return JsonResponse
     */
    public function friendsStats(ValidatorInterface $validator, TopUsersRepository $topUsersRep): JsonResponse
    {
        $params = $this->postJson;
        $constraints = new Assert\Collection([
            'fields' => [
                'friends' => new Assert\All([
                    new Assert\NotBlank,
                    new Assert\Type('int'),
                    new Assert\Range([
                        'min' => 1
                    ])
                ]),
            ],
            'allowExtraFields' => true
        ]);

        if (count($validator->validate($params, $constraints)) > 0) throw new HttpException(422, 'Validation error');

        $friends = $topUsersRep->getByIds($params['friends']);

        return $this->createResponse($friends);
    }

}