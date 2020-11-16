import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import './style.css';

interface Props {
    style?: React.CSSProperties;
    className?: string;
    onMapReference?: (map: mapboxgl.Map | null) => void;
}

export class Mapbox extends React.PureComponent<Props, never> {
    private map: mapboxgl.Map | null = null;

    private handleMapContainerRef = (instance: HTMLDivElement | null) => {
        if (this.map !== null) {
            this.map.remove();
            this.map = null;
        }
        if (instance) {
            this.map = new mapboxgl.Map({ container: instance, trackResize: true });
        }
        this.props.onMapReference?.(this.map);
    };

    public render() {
        return <div style={this.props.style} className={this.props.className} ref={this.handleMapContainerRef} />;
    }
}
