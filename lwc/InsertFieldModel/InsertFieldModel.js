import { api, track } from 'lwc';
import LightningModal from 'lightning/modal';
// import getAllFieldsByObject from '@salesforce/apex/LookFieldTestController.getAllFieldsByObject';
import getAllFieldsByObject from '@salesforce/apex/SelfServicesruleRuleController.getAllFieldsByObject';

export default class InsertFieldModel extends LightningModal {
    @track message;
    @track fieldMap=[];
    @track selectedField;
    @track selectedObject;
    @track result={};
    @api defaultObjects;

    connectedCallback(){
        console.log("connected callback class");
        //this.defaultObjects.map(item=>item["css"]="abc")
        this.fieldMap=[{
            id:this.uniqueId(),
            selectedField:null,
            lookupBox:true,
            loading:false,
            // values:[
            //     {
            //         label:"Agreement>",
            //         API:"Apttus__APTS_Agreement__c",
            //         type:"Reference",
            //         lookupobj:"Apttus__APTS_Agreement__c"
            //     },
            //     {
            //         label:"User>",
            //         API:"User",
            //         type:"Reference",
            //         lookupobj:"User"
            //     }
            // ]
            values:JSON.parse(JSON.stringify(this.defaultObjects))
        }];
        
    }

    uniqueId = () => {
        const dateString = Date.now().toString(36);
        const randomness = Math.random().toString(36).substr(2);
        return dateString + randomness;
    };
    
    async fieldClickHandler(event){
        console.log(event.target.dataset.id);
        let type=event.target.dataset.type;
        let index=this.fieldMap.findIndex(item=> item.id==event.target.dataset.id);
        console.log(index);
        while(this.fieldMap.length-1>index){
            this.fieldMap.pop();
        }
        console.log(this.fieldMap.length);
        let selectedBox=this.fieldMap[index];
        selectedBox.selectedField=event.target.dataset.api;

        //select field logic
        let selectValue=selectedBox.values.findIndex(item=>item.API==selectedBox.selectedField);
        selectedBox.values.map(item=>{
            if(item.API== selectedBox.selectedField){
                item["selectedSyle"]="seletedField";
            }
            else{
                item["selectedSyle"]="";
            }
        })
        if(type=="Reference"){
            if(this.fieldMap.length>1){
                selectedBox.selectedField=selectedBox.selectedField.replace("__c","__r");
            }
            this.fieldMap.push(this.createBox(null,true,true,null));
            console.log(selectedBox.selectedField);
            let api=event.target.dataset.lookupobj;
            //console.log(api);
            let data=await getAllFieldsByObject({"objectName":api}).catch(err=>console.log(err));
            data.map(item=>{
                if(item.type=="Reference"){
                    item.label=item.label+">";
                    item["iconName"]="standard:record_lookup";
                    item["btnStyle"]="fieldIcon lookupIcon";
                }
                //use for auto population field
                if(item.type!="Reference"){
                    item.lookupobj=api;
                    item["iconName"]="standard:record";
                    item["btnStyle"]="fieldIcon";
                    if(item.type=="MultiPicklist" || item.type=="Picklist"){
                        //console.log(JSON.stringify(item.picklistValues));
                        item.picklistValues=JSON.stringify(item.picklistValues);
                    }
                }
                
            })
             //sort the data 
             data.sort((item1,item2)=>item1.label.localeCompare(item2.label));
             
            //this.fieldMap.push(this.createBox(null,true,true,data));
            this.fieldMap[this.fieldMap.length-1].values=data;
            this.fieldMap[this.fieldMap.length-1].loading=false;

           
        }
        else{
            let lookupstring;
            for(let i=1;i<this.fieldMap.length;i++){
                lookupstring= i==1?this.fieldMap[i].selectedField:lookupstring+"."+this.fieldMap[i].selectedField;
            }
            console.log(lookupstring);
            //this.selectedField=lookupstring;
            //this.selectedObject=this.fieldMap[0].selectedField;
            this.result["selectedField"]=lookupstring;
            this.result["selectedObject"]=this.fieldMap[0].selectedField;
            this.result["fieldOfObject"]=event.target.dataset.lookupobj;
            this.result["type"]=event.target.dataset.type;
            this.result["isFormulaField"]=event.target.dataset.isformulafield;
            if(event.target.dataset.picklistval){
                this.result["picklistval"]=event.target.dataset.picklistval;
            }
            else{
                this.result["picklistval"]=null;
            }
            this.fieldMap.push(this.createBox(null,false,false,null));
            
        }

    }

    createBox(selectedField,lookupBox,loading,data){
        return {
            "id":this.uniqueId(),
            "selectedField":selectedField,
            "lookupBox":lookupBox,
            "loading":loading,
            "values":data
        }
    }

    insertFieldHandler(event){
        console.log("close this model");
        //console.log(JSON.stringify(this.result));
        this.close(this.result)
    }
}