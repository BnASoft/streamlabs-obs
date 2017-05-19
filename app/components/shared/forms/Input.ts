import _ from 'lodash';
import Vue from 'vue';
import { Prop } from "vue-property-decorator";

export declare type TObsType =
  'OBS_PROPERTY_BOOL' |
  'OBS_PROPERTY_INT' |
  'OBS_PROPERTY_LIST' |
  'OBS_PROPERTY_PATH' |
  'OBS_PROPERTY_FILE' |
  'OBS_PROPERTY_EDIT_TEXT' |
  'OBS_PROPERTY_UINT' |
  'OBS_PROPERTY_COLOR' |
  'OBS_PROPERTY_DOUBLE' |
  'OBS_PROPERTY_FLOAT' |
  'OBS_PROPERTY_SLIDER';

export declare type TObsValue = number | string | boolean;

export interface IInputValue<TValueType> {
  value: TValueType;
  name: string;
  description: string;
  type: TObsType;
  enabled: boolean;
  masked: boolean;
}

export interface IListOption {
  description: string;
  value: string;
}

export interface IListInputValue extends IInputValue<string> {
  options: IListOption[];
}

export interface IPathInputValue extends IInputValue<string> {
  filters: IElectronOpenDialogFilter[];
}

export interface ISliderInputValue extends IInputValue<number> {
  minVal: number;
  maxVal: number;
  stepVal: number;
}

export interface IElectronOpenDialogFilter {
  name: string;
  extensions: string[];
}

// TODO: do not export this function after source filters will use GenericForm
export function parsePathFilters(filterStr: string): IElectronOpenDialogFilter[] {
  const filters = _.compact(filterStr.split(';;'));

  // Browser source uses *.*
  if (filterStr === '*.*') {
    return [
      {
        name: 'All Files',
        extensions: ['*']
      }
    ];
  }

  return filters.map(filter => {
    const match = filter.match(/^(.*) \((.*)\)$/);
    const desc = match[1];
    let types = match[2].split(' ');

    types = types.map(type => {
      return type.match(/^\*\.(.+)$/)[1];
    });

    // This is the format that electron file dialogs use
    return {
      name: desc,
      extensions: types
    };
  });
}

/**
 * each option represent one known nodeObs issue
 */
interface IObsFetchOptions {
  disabledFields?: string[];
  valueIsObject?: boolean;
  boolIsString?: boolean;
  transformListOptions?: boolean;
  subParametersGetter?: (propName: string) => Dictionary<any>[];
  valueGetter?: (propName: string) => any;
}

export function obsValuesToInputValues(
  obsProps: Dictionary<any>[],
  options: IObsFetchOptions = {}
): IInputValue<TObsValue>[] {

  const resultProps: IInputValue<TObsValue>[] = [];

  for (const obsProp of obsProps) {
    let prop = {...obsProp} as IInputValue<TObsValue>;
    let valueObject: Dictionary<any>;
    let obsValue = obsProp.currentValue;

    if (options.valueGetter) {
      valueObject = options.valueGetter(obsProp.name);
      obsValue = valueObject;
    }

    if (options.valueIsObject) {
      obsValue = obsValue.value
    }

    prop.value = obsValue;

    if (options.disabledFields && options.disabledFields.includes(prop.name)) {
      prop.enabled = false;
    }

    if (obsProp.type === 'OBS_PROPERTY_LIST') {
      const listOptions: any[] = [];

      if (options.transformListOptions) for (const listOption of (obsProp.values || []))  {
        listOptions.push({
          value: listOption[Object.keys(listOption)[0]],
          description: Object.keys(listOption)[0]
        })
      }

      if (options.subParametersGetter) {
        listOptions.push(...options.subParametersGetter(prop.name));
      }

      for (const listOption of listOptions) {
        if (listOption.description == void 0) listOption.description = listOption['name'];
      }

      const needToSetDefaultValue = listOptions.length && prop.value == void 0;
      if (needToSetDefaultValue) prop.value = listOptions[0].value;

      (<any>prop).options = listOptions;

    } else if (obsProp.type === 'OBS_PROPERTY_BOOL') {

      if (options.boolIsString) prop.value = prop.value === 'true';

    } else if (['OBS_PROPERTY_INT', 'OBS_PROPERTY_FLOAT', 'OBS_PROPERTY_DOUBLE'].includes(obsProp.type)) {
      if (obsProp.subType === 'OBS_NUMBER_SLIDER') {
        prop.type = 'OBS_PROPERTY_SLIDER';
        prop = {
          ...prop,
          type: 'OBS_PROPERTY_SLIDER',
          minVal: Number(obsProp.minVal),
          maxVal: Number(obsProp.maxVal),
          stepVal: Number(obsProp.stepVal)
        } as ISliderInputValue
      }
    } else if (obsProp.type === 'OBS_PROPERTY_PATH') {

      if (valueObject && valueObject.type === 'OBS_PATH_FILE') {
        prop = {
          ...prop,
          type: 'OBS_PROPERTY_FILE',
          filters: parsePathFilters(valueObject.filter)
        } as IPathInputValue
      }
    }

    resultProps.push(prop);
  }

  return resultProps;
}

/**
 * each option represent one known nodeObs issue
 */
interface IObsSaveOptions {
  boolToString?: boolean;
  intToString?: boolean;
}

export function inputValuesToObsValues(
  props: IInputValue<TObsValue>[],
  options: IObsSaveOptions = {}
): Dictionary<any>[] {
  const obsProps: Dictionary<any>[] = [];

  for (const prop of props) {
    const obsProp = {...prop} as Dictionary<any>;
    obsProp.currentValue = prop.value;
    obsProps.push(obsProp);

    if (prop.type === 'OBS_PROPERTY_BOOL' ) {
      if (options.boolToString) obsProp.currentValue = obsProp.currentValue ? 'true' : 'false';
    } else if (prop.type === 'OBS_PROPERTY_INT') {
      if (options.intToString) obsProp.currentValue = String(obsProp.currentValue);
    }
    obsProp.value = obsProp.currentValue;
  }
  return obsProps;
}

export class Input<TValueType> extends Vue {

  @Prop()
  value: TValueType;

  emitInput(eventData: TValueType) {
    this.$emit('input', eventData);
  }

}