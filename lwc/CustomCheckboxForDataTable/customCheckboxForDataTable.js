import { LightningElement, api, track } from 'lwc';

export default class CustomCheckboxForDataTable extends LightningElement {

    @api recordid;
    @api disabled;
    @track state=false;

    handleChange(event){
        this.state=event.target.checked;
        console.log(this.recordid);
        let paramData={Id:this.recordid,state:this.state}
        const ev = new CustomEvent('handlecheckboxevent', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: paramData,
        });
        this.dispatchEvent(ev);

    }
    renderedCallback(){
        const element = this.template.querySelector('[data-id="checkbox"]');
        console.log(element);
        if(this.disabled==true){
            element.checked=false;
        }
    }
}