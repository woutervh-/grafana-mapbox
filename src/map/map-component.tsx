import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import { css } from 'emotion';
import { Mapbox } from './mapbox/mapbox';

interface Props {
    styleUrl: string;
    width: number;
    height: number;
    onMapReference?: (map: mapboxgl.Map | null) => void;
}

export class MapComponent extends React.PureComponent<Props, never> {
    private map: mapboxgl.Map | null = null;

    public componentDidUpdate(prevProps: Props) {
        if (this.props.styleUrl !== prevProps.styleUrl) {
            if (this.map) {
                this.map.setStyle(this.props.styleUrl);
            }
        }
        if (this.props.width !== prevProps.width || this.props.height !== prevProps.height) {
            if (this.map) {
                this.map.resize();
            }
        }
    }

    private handleMapReference = (map: mapboxgl.Map | null) => {
        if (map) {
            map.showTileBoundaries = true;
            map.addControl(new mapboxgl.ScaleControl());
            map.setStyle(this.props.styleUrl);
            map.once('load', () => {
                this.props.onMapReference?.(map);
            });
        }
        this.map = map;
    };

    public render() {
        return <Mapbox
            className={css`
              background-color: white;
            `}
            style={{
                width: this.props.width,
                height: this.props.height
            }}
            onMapReference={this.handleMapReference}
        />;
    }
}
