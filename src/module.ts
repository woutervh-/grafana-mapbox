import { PanelPlugin } from '@grafana/data';
import { MapboxPanelOptions } from './types';
import { MapboxPanel } from './MapboxPanel';

export const plugin = new PanelPlugin<MapboxPanelOptions>(MapboxPanel).setPanelOptions(builder => {
  return builder
    .addTextInput({
      path: 'style-url',
      name: 'Style URL',
      description: 'URL (remote or data-url) to the Mapbox base style in JSON format',
      defaultValue: 'data:application/json;charset=utf-8;base64,ew0KICAgICJ2ZXJzaW9uIjogOCwNCiAgICAic291cmNlcyI6IHt9LA0KICAgICJsYXllcnMiOiBbXQ0KfQ=='
    })
    .addTextInput({
      path: 'time-column-name',
      name: 'Time column name',
      description: 'Name of the column which contains the time values of the series',
      defaultValue: 'time'
    })
    .addTextInput({
      path: 'wkt-column-name',
      name: 'WKT column name',
      description: 'Name of the column which contains the WKT values of the series',
      defaultValue: 'wkt'
    })
    .addBooleanSwitch({
      path: 'show-circles',
      name: 'Show circles',
      description: 'Indicate whether or not the parsed WKT is displayed as circles',
      defaultValue: true
    })
    .addBooleanSwitch({
      path: 'show-lines',
      name: 'Show lines',
      description: 'Indicate whether or not the parsed WKT is displayed as lines',
      defaultValue: true
    });
});
