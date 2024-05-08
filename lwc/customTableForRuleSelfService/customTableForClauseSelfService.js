import LightningDatatable from 'lightning/datatable';
import ruleSelfServiceViewLink from './ruleSelfServiceViewLink.html';
import dataTableCustomCheckbox from './dataTableCustomCheckbox';

export default class CustomTableForruleSelfService extends LightningDatatable  {

    static customTypes={
        ruleSelfServiceViewLink:{
            template:ruleSelfServiceViewLink,
            typeAttributes:['ruleName','recordId']
        },
        dataTableCustomCheckbox:{
            template:dataTableCustomCheckbox,
            typeAttributes:['Id','disabled']
        }
    }
}