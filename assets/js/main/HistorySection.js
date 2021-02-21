import React from 'react';
import {
    Avatar,
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

@inject("mainStore")
@observer
class HistorySection extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
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

    fetch = ({mainStore} = this.props) => {
        if (this.state.history.length > 0) return false;

        this.props.spinner(true);
        const userId = mainStore.user.info.user_id;

        axios.post(`${prefix}/api/history/${userId}/get`, {
            auth: mainStore.auth,
        }).then(r => {
            const {status, data} = r.data;

            if (!status) throw new Error('Failed to fetch history');

            this.setState({ history: data })
        }).catch(e => {

        }).finally(() => {
            this.props.spinner(false);
        })
    };

    componentDidMount() {
        moment.tz.setDefault("Europe/Moscow");
        this.fetch();
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

                        <Text weight="regular" style={{ marginBottom: 16, marginTop: 16 }}>
                            {store.userProfile.first_name}, вы открыли сундук и в нем вы нашли:<br/>
                            {selectedItem.product.price} {brainCoin(selectedItem.product.price)}!
                            {!selectedItem.completed &&
                                <>
                                    <br/>
                                    <br/>
                                    Администратор в течении 48 часов начислит ваш выигрыш. Ожидайте, пожалуйста!
                                </>
                            }
                        </Text>
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