import React from 'react';
import {Avatar, Div, Headline, Link} from '@vkontakte/vkui';
import PropTypes from 'prop-types';
import {declOfNum} from "../utils";

class HistorySection extends React.Component {
    constructor(props) {
        super(props);
    }

    showInfo = () => {};

    render() {
        return (
            <Div className="History">
                {this.props.history.map(item =>
                    <div key={item.id} className="History__item">
                        <div className="History__photo">
                            <Avatar src={item.orders.product.photo ?? 'https://vk.com/images/camera_200.png?ava=1'} />
                        </div>
                        <div className="History__info">
                            <div style={{ padding: '0 15px' }}>
                                <div>
                                    <Headline weight="semibold" style={{ display: 'inline-block' }}>{item.orders.product.name}</Headline>
                                    <Link onClick={this.showInfo} style={{ float: 'right' }}>Подробнее</Link>
                                </div>
                                <div>
                                    {item.orders.product.price} 💎 {declOfNum(item.orders.product.price, ['умникоин', 'умникоина', 'умникоинов'])}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Div>
        );
    }
}

HistorySection.propTypes = {
    history: PropTypes.array
};

export default HistorySection;