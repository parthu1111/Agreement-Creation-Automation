import { LightningElement, api, track } from 'lwc';
import LightningModal from 'lightning/modal';
import bulkApprovalForSelectedRecords from '@salesforce/apex/SelfServiceruleRuleHelperClass.bulkApprovalForSelectedRecords';

export default class ruleSelfServiceApprovalSubmission extends LightningModal {

    @api label;
    @track loadingComponant = false;
    @api records;
    @track error;

    constructor() {
        super();
    }
    connectedCallback() {
        //,"comment":"test"
        this.records=this.records.map((item,index)=>{
            return {...item,"index":index}
        })
    }
    handleTextArea(event) {
        //console.log(event.target.dataset.index);
        //console.log(event.detail.value);
        this.records[event.target.dataset.index].comment=event.detail.value;
        //console.log(JSON.stringify(this.records[event.target.dataset.index]));
    }
    bulkApprovalSubmit() {

        try {
            this.error=null;
            this.loadingComponant=true;
            //this.records=this.records.filter(item=> item.status=="Approval Required");
            console.log(JSON.stringify(this.records));
            bulkApprovalForSelectedRecords({ records: this.records })
                .then(res => {
                    console.log(res);
                    this.loadingComponant=false;
                    this.close({isSuccess:res});
                })
                .catch(err => {
                    throw err.body.message;
                })
        }
        catch (err) {
            console.log(err);
            this.loadingComponant=false;
            this.error=err;
        }
    }
}