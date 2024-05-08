import { LightningElement,api,track,wire } from 'lwc';
import { getRecord,getFieldValue } from 'lightning/uiRecordApi';

import _proposal_clone_status__c from "@salesforce/schema/Apttus_Proposal__Proposal__c._proposal_clone_status__c";
const FIELDS = [_proposal_clone_status__c];
export default class ProposalCloneStatus extends LightningElement {

    @api recordId;
    @track cloneStatus;
    @track iconName='utility:success';
    @track cssContainer='container'

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredCustomObject({ error, data }) {
        if (data) {
            this.cloneStatus=getFieldValue(data,_proposal_clone_status__c);
            if(this.cloneStatus.includes('EXCEPTION')){
                this.iconName='utility:error';
                this.cssContainer='container_err';
            }
            if(this.cloneStatus.includes('INTIAL')){
                this.iconName='utility:warning';
                this.cssContainer='container_warning';
            }
            console.log(this.iconName);
            
        } else if (error) {
            console.error('Error fetching custom object data:', error);
        }
    }
}