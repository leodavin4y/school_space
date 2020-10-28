import React from 'react';
import {Div} from '@vkontakte/vkui';
import PropTypes from 'prop-types';

class HistorySection extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Div>
                {this.props.history.map(item =>
                    <>{item.id}</>
                )}
            </Div>
        );
    }
}

HistorySection.propTypes = {
    history: PropTypes.array
};

export default HistorySection;