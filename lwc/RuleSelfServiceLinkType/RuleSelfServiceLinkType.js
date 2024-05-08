import { LightningElement, api} from 'lwc';

export default class ruleSelfServiceLinkType extends LightningElement {

    @api name;
    @api recordid;

    handleClick(event){
        event.stopPropagation();
        let paramData={Id:this.recordid}
        const ev = new CustomEvent('viewrecord', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: paramData,
        });
        this.dispatchEvent(ev);
    }
}