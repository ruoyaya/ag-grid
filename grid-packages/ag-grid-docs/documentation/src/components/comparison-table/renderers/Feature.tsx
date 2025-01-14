import classNames from 'classnames';
import React from 'react';
import styles from '@design-system/modules/ComparisonTableRenderers.module.scss';
import { Icon } from '../../Icon';

export function Feature({ value }: { value: boolean | string }) {
    const isEnabled = value === true || value.value === true;

    return <div className={styles.feature}>
      { isEnabled && <span className={styles.tick}><Icon name="tick"/></span> }
      { !isEnabled && <span className={styles.dash}>—</span> }

      { value.detail && <span className={styles.detail} dangerouslySetInnerHTML={{ __html: value.detail }}></span> }
    </div> 
}