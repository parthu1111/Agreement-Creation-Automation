import { LightningElement,track,api,wire } from 'lwc';
import { getRecord,getFieldValue  } from 'lightning/uiRecordApi';
import _Is_regenerate_required__c from '@salesforce/schema/Apttus__APTS_Agreement__c._Is_regenerate_required__c';
import getCustomSetting from '@salesforce/apex/SelfServiceruleRuleHelperClass.getCustomSetting';
//const FIELDS=['Apttus__APTS_Agreement__c._Is_regenerate_required__c'];

export default class RegenerateDocBanner extends LightningElement {

    @api recordId;
    @track banner_label=null;

    async connectedCallback(){
        console.log('loading banner cmp.....');
        console.log(this.recordId);
        //let res=await getBannerMessage().catch(err=>console.log(err));
        getCustomSetting()
        .then(res=>{
            this.banner_label=res!=null?res[0].Regenerate_Banner_Label__c:'something went wrong!';
        })
        .catch(err=>console.log(err))
    }
    @wire(getRecord,{ recordId: '$recordId', fields: [_Is_regenerate_required__c] })
    obj;

    get get__Is_regenerate_required__c(){
        return getFieldValue(this.obj.data, _Is_regenerate_required__c);
    }
}