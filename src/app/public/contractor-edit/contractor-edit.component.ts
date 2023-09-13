import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'contractor-edit',
  templateUrl: './contractor-edit.component.html',
  styleUrls: ['./contractor-edit.component.scss'],
})
export class ContractorEditComponent implements OnInit {
  clientID!: string;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      if (params['clientID']) {
        this.clientID = params['clientID'];
      }
    });
  }

  ngOnInit(): void {}
}
