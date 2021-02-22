import React from 'react';
import {
    Avatar, Div,
    PanelHeader, PanelHeaderBack, PanelHeaderButton, Text,
    Title, Group, RichCell
} from '@vkontakte/vkui';
import PropTypes from 'prop-types';
import {brainCoin} from "../utils";
import {inject, observer} from "mobx-react";
import moment from "moment";
import 'moment-timezone';
import axios from "axios";
import Popup from '../components/popup/popup';
import DiamondBrainCoin from '../components/DiamondBrainCoin/DiamondBrainCoin';

moment.tz.setDefault("Europe/Moscow");

/**
 * Текст после покупки (В админке в разделе промокодов у товара)
 *
 * @param user
 * @param product
 * @param promo
 * @returns {string}
 * @constructor
 */
const PurchaseMsg = ({ user, product, promo }) => {
    let text = promo.msg;

    text = text.replace(/%имя%/ig, user.first_name);
    text = text.replace(/%фамилия%/ig, user.last_name);
    text = text.replace(/%промокод%/ig, promo.code);

    return (
        <Div>{text}</Div>
    );
};

@inject("mainStore")
@observer
class HistorySection extends React.Component {

    constructor(props) {
        super(props);

        this.scrollLocked = false;
        this.state = {
            page: 1,
            history: [],
            selectedItem: null
        };
    }

    showInfo = (item) => {
        this.setState({
            selectedItem: item
        })
    };

    hideInfo = () => {
        this.setState({
            selectedItem: null
        })
    };

    fetch = ({ mainStore, spinner } = this.props) => {
        const {page, history} = this.state;
        const userId = mainStore.user.info.user_id;

        spinner(true);
        axios.post(`${prefix}/api/history/${userId}/get`, {
            page: page,
            auth: mainStore.auth,
        })
            .then(r => {
                const {status, data} = r.data;
                if (!status) throw new Error('Failed to fetch history');

                this.setState({
                    history: [...history, ...data]
                })
            })
            .catch(e => {})
            .finally(() => {
                spinner(false);
                this.scrollLocked = false;
            })
    };

    docBottomIsReached = () => {
        return document.body.offsetHeight + window.pageYOffset >= document.body.scrollHeight - 100;
    };

    scrollHandler = () => {
        if (!this.scrollLocked && this.docBottomIsReached()) {
            this.setState((state) => {
                return {
                    page: state.page + 1
                };
            }, () => {
                this.scrollLocked = true;
                this.fetch();
            });
        }
    };

    componentDidMount() {
        this.fetch();

        window.addEventListener('scroll', this.scrollHandler);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.scrollHandler);
    }

    render() {
        const store = this.props.mainStore;
        const {selectedItem} = this.state;
        const back = () => {window.history.back()};
        const Price = ({ amount }) => {
            return (
                <>
                    {amount}
                    &nbsp;
                    <DiamondBrainCoin
                        width={12}
                        height={12}
                        amount={amount}
                    />
                </>
            );
        };
        const prodPhoto = (item) => {
            return item.product.photo ?
                `${prefix}/upload/products/${item.product.photo}` :
                'https://vk.com/images/camera_200.png?ava=1';
        };

        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={back}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={back} />}
                >
                    История покупок
                </PanelHeader>

                <Group className="History">
                    {this.state.history.map(item =>
                        <RichCell
                            key={item.id}
                            onClick={() => {this.showInfo(item)}}
                            before={<Avatar size={48} src={prodPhoto(item)} />}
                            caption={<Price amount={item.product.price} />}
                        >
                            {item.product.name}
                        </RichCell>
                    )}
                </Group>

                {this.state.selectedItem &&
                    <Popup onClose={this.hideInfo}>
                        <Title level="2" weight="semibold" style={{ marginBottom: 16, textTransform: 'uppercase' }}>
                            Информация о покупке
                        </Title>

                        <div style={{ width: 250, margin: '0 auto' }}>
                            <span style={{ display: 'inline-block', width: '35%', textAlign: 'left' }}>
                                {new moment(selectedItem.created_at).format('DD.MM.YYYY')}
                            </span>
                            <span style={{ display: 'inline-block', width: '65%', textAlign: 'right' }}>
                                Статус: &nbsp;
                                <span style={{ color: 'var(' + (selectedItem.completed ? '--dynamic_green' : '--dynamic_red') + ')' }}>
                                    {selectedItem.completed ? 'получено' : 'в процессе'}
                                </span>
                            </span>
                        </div>

                        {selectedItem.promo_code &&
                            <Text weight="regular">
                                <PurchaseMsg
                                    user={store.userProfile}
                                    product={selectedItem.product}
                                    promo={selectedItem.promo_code}
                                />

                                {!selectedItem.completed &&
                                    <div>
                                        Администратор в течении 48 часов начислит ваш выигрыш. Ожидайте, пожалуйста!
                                    </div>
                                }
                            </Text>
                        }
                    </Popup>
                }
            </>
        );
    }
}

HistorySection.propTypes = {
    spinner: PropTypes.func
};

export default HistorySection;