import React from 'react';
import {Icon56DiamondOutline} from "@vkontakte/icons";
import {brainCoin} from "../../utils";

function DiamondBrainCoin({ amount, width, height })
{
    return (
        <>
            <Icon56DiamondOutline
                width={width ? width : 12}
                height={height ? height : 12}
                fill={'#008cff'}
                style={{ display: 'inline-block' }}
            />
            &nbsp;
            {brainCoin(amount)}
        </>
    );
}

export default DiamondBrainCoin;