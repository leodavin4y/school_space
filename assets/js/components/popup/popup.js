import React from 'react';
import PropTypes from 'prop-types';
import {inject, observer} from "mobx-react";
import {Div} from '@vkontakte/vkui';
import '../../../css/popup.css';

@inject("mainStore")
@observer
class Popup extends React.Component {
    constructor(props) {
        super(props)
    }

    close = () => {
        this.props.onClose();
    };

    render() {
        const store = this.props.mainStore;

        return (
            <div className="PopupLeo__back" onClick={this.close}>
                <div className={"PopupLeo" + (store.isMobile ? ' mobile' : '')} onClick={(e) => {e.stopPropagation()}}>
                    <Div>
                        {React.Children.map(this.props.children, (child) =>
                            <>
                                {child}
                            </>
                        )}
                    </Div>
                </div>
            </div>
        );
    }
}

PropTypes.propTypes = {
    onClose: PropTypes.func
};

export default Popup;