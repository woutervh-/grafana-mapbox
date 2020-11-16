import * as React from 'react';
import * as ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';

interface Props {
    map: mapboxgl.Map;
    lngLat: mapboxgl.LngLat;
    className?: string;
}

export class Popup extends React.PureComponent<Props, never> {
    private container = document.createElement('div');
    private popup: mapboxgl.Popup | null = null;

    public componentDidMount() {
        this.popup = new mapboxgl.Popup({ className: this.props.className })
            .setLngLat(this.props.lngLat)
            .setDOMContent(this.container)
            .addTo(this.props.map);
    }

    public componentWillUnmount() {
        if (this.popup) {
            this.popup.remove();
        }
    }

    public componentDidUpdate(prevProps: Props) {
        if (this.props.map !== prevProps.map) {
            if (this.popup) {
                this.popup.remove();
                this.popup.addTo(this.props.map);
            }
        }
        if (this.props.lngLat.lat !== prevProps.lngLat.lat || this.props.lngLat.lng !== prevProps.lngLat.lng) {
            this.popup?.setLngLat(this.props.lngLat);
        }
        if (this.props.className !== prevProps.className) {
            if (this.popup) {
                if (prevProps.className) {
                    this.popup.removeClassName(prevProps.className);
                }
                if (this.props.className) {
                    this.popup.addClassName(this.props.className);
                }
            }
        }
    }

    public render() {
        return ReactDOM.createPortal(this.props.children, this.container);
    }
}
