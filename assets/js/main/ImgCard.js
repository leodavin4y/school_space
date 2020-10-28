import React from 'react';
import PropTypes from 'prop-types';

class ImgCard extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const style = Object.assign({
            backgroundColor: 'var(--background_light)',
            backgroundImage: 'url("' + (this.props.src) + '")',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: 10,
            marginBottom: 15
        }, this.props.style ?? {});
        const props = {};

        for (let k in this.props) {
            if (k === 'src') continue;
            if (k === 'style') continue;
            props[k] = this.props[k];
        }

        return (
            <div
                {...props}
                style={style}
            />
        );
    }
}

ImgCard.propTypes = {
    src: PropTypes.string
};

export default ImgCard;