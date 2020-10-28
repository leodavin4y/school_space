import React from "react";
import {
    ActionSheet,
    ActionSheetItem,
    Div,
    IOS,
    Link,
    Group,
    Header,
    SimpleCell,
    InfoRow,
    withPlatform,
} from '@vkontakte/vkui';
import axios from "axios";
import moment from 'moment';
import {inject, observer} from "mobx-react";
import PropTypes from 'prop-types';
import {declOfNum} from "../../utils";
import Icon16Dropdown from '@vkontakte/icons/dist/12/dropdown';

@inject("mainStore")
@observer
class ReviewItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    profile = () => {
        const {user} = this.props;
        this.props.onModal(
            <Div>
                <Group>
                    <Header mode="secondary">Анкета ученика</Header>
                    <SimpleCell multiline>
                        <InfoRow header="Город">
                            {user.city}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Школа">
                            {user.school}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Класс">
                            {user.class}{user.letter}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Учитель">
                            {user.teacher}
                        </InfoRow>
                    </SimpleCell>
                </Group>
            </Div>
        );
    };

    openPhoto = (photo) => {
        window.open(photo);
    };

    pointToUser = (pointId, {user, onCoinsSet, onCoinsUpdate, onSnack, approveButton} = this.props) => {
        const points = parseInt(prompt('Введите кол-во баллов для "' + user.first_name + '"'));

        if (isNaN(points)) return false;

        const action = approveButton ? 'set' : 'update';

        axios({
            method: 'post',
            url: `/admin/points/${action}`,
            data: {
                id: pointId,
                amount: points,
                auth: this.props.mainStore.auth
            }
        }).then(r => {
            if (!r.data.status) throw new Error('Failed to set points');

            onSnack(`Пользователю ${user.first_name} начислено ${points} ` + declOfNum(points, ['бал', 'балла', 'баллов']));

            return approveButton ? onCoinsSet() : onCoinsUpdate(points);
        }).catch(e => {
            onSnack('Ошибка: Не удалось начислить баллы пользователю');
        });
    };

    declineRequest = (pointId, {onSnack, onDeclineRequest} = this.props) => {
        const comment = prompt('Введите комментарий для ученика').trim();

        if (comment === '') {
            alert('Комментарий не может быть пуст');
            return false;
        }

        axios({
            method: 'post',
            url: `/admin/points/${pointId}/cancel`,
            data: {
                comment: comment,
                auth: this.props.mainStore.auth
            }
        }).then(r => {
            if (!r.data.status) throw new Error('Failed to decline request');

            onDeclineRequest();
            onSnack(`Заявка #${pointId} успешно отклонена`)
        }).catch(e => {
            onSnack(`Ошибка: Не удалось отклонить заявку #${pointId}`);
        });
    };

    dateFormat = (date, format) => {
        return moment(date).format(format);
    };

    showOption = () => {
        const PLATFORM = this.props.platform;
        const IS_IOS = PLATFORM === IOS;
        const reviewId = this.props.id;

        this.props.onPopout(
            <ActionSheet onClose={() => {this.props.onPopout(null)}}>
                <ActionSheetItem
                    autoclose
                    onClick={this.profile}
                >
                    Анкета ученика
                </ActionSheetItem>
                <ActionSheetItem
                    autoclose
                    onClick={
                        () => {this.pointToUser(reviewId)}
                    }
                >
                    {this.props.approveButton ? 'Начислить' : 'Изменить'} баллы
                </ActionSheetItem>

                {this.props.approveButton &&
                    <ActionSheetItem
                        mode="destructive"
                        autoclose
                        onClick={
                            () => {this.declineRequest(reviewId)}
                        }
                    >
                        Отклонить заявку
                    </ActionSheetItem>
                }

                {IS_IOS && <ActionSheetItem autoclose mode="cancel">Выход</ActionSheetItem>}
            </ActionSheet>
        );
    };

    render() {
        const {user, photos, id, amount, cancel, cancelComment, createdAt, dateAt} = this.props;

        return (
            <>
                <Div style={{ padding: 0, borderBottom: '1px solid #ccc' }}>
                    <div className="ReviewItem__top">
                        <span>#{id}</span>
                        <span>
                            Прислано: {this.dateFormat(createdAt, 'HH:mm, D-MM-YY')}
                        </span>
                        <span onClick={this.showOption} style={{ cursor: 'pointer', padding: 2 }}>
                            <Icon16Dropdown style={{ display: 'inline-block', color: 'var(--button_primary_background)' }} width={16} height={12}/>
                        </span>
                    </div>

                    <div className='ReviewItem__left'>
                        <img src={user.photo_100} style={{ borderRadius: '100%' }} width={30} height={30} alt={null}/>
                    </div>

                    <div className='ReviewItem__right'>
                        <div>
                            <Link href={'https://vk.com/id' + user.user_id} target="_blank">
                                {user.first_name}
                            </Link>
                            <span className='badge badge-secondary' style={{ margin: '0 5px 0 5px' }}>
                                Дата: {this.dateFormat(dateAt, 'D-MM-YY')}
                            </span>
                            <span className='badge badge-secondary' style={{ margin: '0 5px 0 0' }}>
                                Баллы: {amount}
                            </span>
                        </div>
                    </div>

                    <div className='ReviewItem__bottom'>
                        <div className='ReviewItem__bottom-left'/>
                        <div className='ReviewItem__bottom-right'>
                            <div style={{ fontSize: '0.7rem' }}>Загружено фото: {photos.length}</div>
                            <div className='imgwrap'>
                                {photos.map((photo, index) =>
                                    <div
                                        key={index}
                                        className='ReviewItem__img'
                                        style={{ backgroundImage: 'url(' + '/upload/' + photo.name + ')' }}
                                        onClick={() => {this.openPhoto('/upload/' + photo.name)}}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </Div>
            </>
        );
    }
}

ReviewItem.propTypes = {
    onPopout: PropTypes.func,
    onModal: PropTypes.func,
    onCoinsSet: PropTypes.func,
    onCoinsUpdate: PropTypes.func,
    onDeclineRequest: PropTypes.func,
    onSnack: PropTypes.func,
    user: PropTypes.object,
    photos: PropTypes.array,
    id: PropTypes.number,
    amount: PropTypes.number,
    cancel: PropTypes.bool,
    cancel_comment: PropTypes.string,
    createdAt: PropTypes.number,
    dateAt: PropTypes.number,
    approveButton: PropTypes.bool,
};

export default withPlatform(ReviewItem);