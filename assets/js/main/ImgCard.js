import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class ImgCard extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const style = Object.assign({
            backgroundColor: 'var(--background_light)',
            backgroundImage: 'url("' + (this.props.src) + '")',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: 10,
            margin: '0 15px 0 0',
        }, this.props.style ?? {});
        const props = {};

        for (let k in this.props) {
            if (k === 'src') continue;
            if (k === 'style') continue;
            props[k] = this.props[k];
        }

        return (
            <div
                className={classNames({"ImgCard": true, "mobile": this.props.mobile})}
                {...props}
                style={style}
            />
        );
    }
}

ImgCard.propTypes = {
    src: PropTypes.string,
    mobile: PropTypes.bool
};

export default ImgCard;