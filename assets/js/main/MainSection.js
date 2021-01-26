import React from 'react';
import {Link} from "react-router-dom";
import classNames from "classnames";
import {declOfNum} from "../utils";
import {Button as VKButton, Card, Div, Link as VKLink, Text, Title} from "@vkontakte/vkui";
import {Icon56DownloadSquareOutline, Icon24Info, Icon24Settings} from '@vkontakte/icons';
import MostActive from '../stats/MostActive';
import {inject, observer} from "mobx-react";
import PropTypes from 'prop-types';
import Popup from '../components/popup/popup';

@inject("mainStore")
@observer
class MainSection extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            popupForSync: false,
            popupForCoins: false,
            spinner: null
        };
    }

    render() {
        const store = this.props.mainStore;
        const user = store.user;
        const balance = user && user.info && user.info.balance ? user.info.balance : 0;
        const {topUsers} = this.props;
        const {popupForSync, popupForCoins} = this.state;

        return (
            <>
                <Div>
                    <Card size="l" mode="shadow" className={classNames({ "UserBalanceCard": true, 'mobile': store.isMobile })}>
                        <Div style={{ height: 110 }}>
                            <div className="UserBalanceCard__header text-up">
                                Баланс школьной криптовалюты
                                <div style={{ float: 'right' }}>
                                    <Icon24Info onClick={() => {this.setState({popupForCoins: true})}}/>
                                </div>
                            </div>

                            <div className="UserBalanceCard__title text-up">
                                <strong>{balance}</strong> 💎 {declOfNum(balance, ['Умникоин', 'Умникоина', 'Умникоинов'])}
                            </div>

                            <Link to={`${prefix}/get-coins`}>
                                <VKButton mode="overlay_primary" className="text-up" style={{ marginTop: 15 }}>
                                    Обменять оценки
                                </VKButton>
                            </Link>

                            <VKLink className="SyncBtn" onClick={() => {this.setState({popupForSync: true})}}>
                                <Icon24Settings width={20} height={20} /> Синхронизировать <br/>
                                электронный журнал
                            </VKLink>
                        </Div>
                    </Card>
                </Div>

                <Div>
                    <Title level="3" weight="medium" style={{ marginBottom: 5, textTransform: 'uppercase' }}>
                        Самые активные за месяц
                    </Title>

                    <MostActive
                        initInProgress={this.props.initInProgress}
                        users={topUsers}
                        moreBtn={<Link to={`${prefix}/stats`} style={{ textDecoration: 'none' }}>
                            <VKButton
                                size="xl"
                                mode="primary"
                                style={{ marginTop: 15, cursor: 'pointer' }}
                            >
                                Подробная статистика
                            </VKButton>
                        </Link>}
                    />
                </Div>

                {popupForSync &&
                    <Popup onClose={() => this.setState({popupForSync:false})}>
                        <div style={{ width: 56, margin: '0 auto' }}>
                            <Icon56DownloadSquareOutline style={{ color: 'var(--accent)' }}/>
                        </div>

                        <Title level="2" weight="semibold" style={{ marginBottom: 16, textTransform: 'uppercase' }}>
                            Синхронизировать электронный журнал
                        </Title>

                        <Text weight="regular" style={{ marginBottom: 16 }}>
                            Функция автоматической конвертации оценок из электронного дневника в умникоины в стадии разработки.
                            Воспользуйтесь стандартной формой загрузки оценок.
                        </Text>

                        <Div>
                            <Link to={`${prefix}/get-coins`}>
                                <VKButton size="l" mode="primary">Обменять оценки</VKButton>
                            </Link>
                        </Div>
                    </Popup>
                }

                {popupForCoins &&
                    <>
                        <Popup onClose={() => this.setState({popupForCoins:false})}>
                            <Title level="2" weight="semibold" style={{ margin: '16px 0', textTransform: 'uppercase' }}>
                                Умникоины
                            </Title>

                            <Text weight="regular" style={{ marginBottom: 16 }}>
                                Это баллы мотивации за школьные, творческие и спортивные успехи.
                                Накопленные умникоины можно обменять на товары в благотворительном магазине.
                            </Text>

                            <Div>
                                <Link to={`${prefix}/get-coins`}>
                                    <VKButton size="l" mode="primary">Обменять оценки</VKButton>
                                </Link>
                            </Div>
                        </Popup>
                    </>
                }

                {this.state.spinner}
            </>
        );
    }
}

MainSection.propTypes = {
    initInProgress: PropTypes.bool,
    topUsers: PropTypes.array
};

export default MainSection;