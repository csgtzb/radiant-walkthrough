// 单位为米。bounds 顺序为 xMin, zMin, xMax, zMax。开口坐标沿墙轴递增。
const PLAN = {
  "name": "Radiant 2C",
  "units": "m",
  "source": {
    "file": "2B - Radiant.pdf",
    "page": 1,
    "planImage": "assets/plan.png",
    "imageSize": [
      783,
      844
    ],
    "imageOrigin": "裁切图左上角为 (0,0)，x 向右，z 向下",
    "metersPerPixel": 0.01191490909090909,
    "calibration": [
      {
        "room": "次卧",
        "pixels": [
          [
            333,
            580
          ],
          [
            608,
            812
          ]
        ],
        "referenceInches": [
          129,
          110
        ],
        "note": "东西向定比例，南北向独立复核。左端取衣柜开口所在平面。"
      },
      {
        "room": "主卧",
        "pixels": [
          [
            45,
            40
          ],
          [
            275,
            324
          ]
        ],
        "referenceInches": [
          108,
          134
        ],
        "note": "东端取衣柜开口所在平面，避开上方墙垛。"
      },
      {
        "room": "客厅",
        "pixels": [
          [
            340,
            40
          ],
          [
            607,
            362
          ]
        ],
        "referenceInches": [
          126,
          151
        ],
        "note": "南端为按标注推定的开放区边界，进深仅供参考。"
      }
    ]
  },
  "parameters": {
    "clearHeight": 2.7,
    "doorHead": 2.08,
    "windowSill": 0.8,
    "windowHead": 2.2,
    "sliderHead": 2.2,
    "guardHeight": 1.05,
    "eyeHeight": 1.40,
    "bodyRadius": 0.17
  },
  "assumptions": [
    "室内净高 2.70 m 为用户暂定值。",
    "墙体及洞口平面位置、厚度来自图面描取。",
    "门窗及护栏高度、窗框细节、推拉门开放扇位置属于展示假设。",
    "洗烘设备及两处浴室柜的占地按平面图估算。洗烘叠放、设备立面与台面高度均为展示假设。",
    "按图示方向建模。阳台等高处理，入户门外无公共走廊。"
  ],
  "fixtures": [
    {
      "id": "laundry-stack", "kind": "laundryStack", "name": "洗衣机与烘干机",
      "bounds": [2.89532, 3.95575, 3.58639, 4.80171], "front": "south", "height": 1.72
    },
    {
      "id": "ensuite-vanity", "kind": "vanity", "name": "套卫浴室柜",
      "bounds": [1.97787, 4.92086, 2.67609, 5.42962], "front": "north", "height": 0.85
    },
    {
      "id": "bath-vanity", "kind": "vanity", "name": "公卫浴室柜",
      "bounds": [1.97787, 5.72273, 2.67609, 6.23150], "front": "south", "height": 0.85
    }
  ],
  "floors": [
    {
      "id": "interior",
      "polygon": [
        [
          0.3217,
          0.16681
        ],
        [
          7.55405,
          0.16681
        ],
        [
          7.55405,
          1.38213
        ],
        [
          7.45873,
          1.38213
        ],
        [
          7.45873,
          5.17107
        ],
        [
          7.55405,
          5.17107
        ],
        [
          7.55405,
          9.9132
        ],
        [
          0.14298,
          9.9132
        ],
        [
          0.14298,
          3.71745
        ],
        [
          0.3217,
          3.71745
        ]
      ]
    },
    {
      "id": "balcony",
      "polygon": [
        [
          7.45873,
          1.37021
        ],
        [
          9.13874,
          1.37021
        ],
        [
          9.13874,
          5.7549
        ],
        [
          7.55405,
          5.7549
        ],
        [
          7.55405,
          5.17107
        ],
        [
          7.45873,
          5.17107
        ]
      ]
    }
  ],
  "walls": [
    {
      "id": "north-facade",
      "bounds": [
        0.3217,
        0.16681,
        7.55405,
        0.4766
      ],
      "axis": "x",
      "openings": [
        {
          "kind": "window",
          "start": 0.98894,
          "end": 3.07405,
          "profile": "window"
        },
        {
          "kind": "window",
          "start": 4.25362,
          "end": 6.33873,
          "profile": "window"
        }
      ]
    },
    {
      "id": "west-main",
      "bounds": [
        0.3217,
        0.4766,
        0.53617,
        3.71745
      ],
      "axis": "z",
      "openings": []
    },
    {
      "id": "west-jog",
      "bounds": [
        0.14298,
        3.71745,
        0.53617,
        3.93192
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "west-entry",
      "bounds": [
        0.14298,
        3.93192,
        0.34553,
        9.9132
      ],
      "axis": "z",
      "openings": []
    },
    {
      "id": "main-column",
      "bounds": [
        3.28851,
        0.4766,
        4.05107,
        1.23915
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "living-column",
      "bounds": [
        6.88682,
        0.4766,
        7.55405,
        1.38213
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "east-glazing",
      "bounds": [
        7.23235,
        1.38213,
        7.45873,
        5.17107
      ],
      "axis": "z",
      "openings": [
        {
          "kind": "glass",
          "start": 1.38213,
          "end": 2.89532,
          "profile": "fullGlass"
        },
        {
          "kind": "passage",
          "start": 2.89532,
          "end": 3.97958,
          "profile": "slider"
        },
        {
          "kind": "glass",
          "start": 3.97958,
          "end": 5.17107,
          "profile": "fullGlass"
        }
      ]
    },
    {
      "id": "east-bedroom",
      "bounds": [
        7.23235,
        5.17107,
        7.55405,
        9.67491
      ],
      "axis": "z",
      "openings": [
        {
          "kind": "window",
          "start": 7.18469,
          "end": 9.18639,
          "profile": "window"
        }
      ]
    },
    {
      "id": "south-facade",
      "bounds": [
        0.14298,
        9.67491,
        7.55405,
        9.9132
      ],
      "axis": "x",
      "openings": [
        {
          "kind": "entry",
          "start": 0.41702,
          "end": 1.42979,
          "profile": "door"
        }
      ]
    },
    {
      "id": "main-closet-back",
      "bounds": [
        3.97958,
        1.23915,
        4.05107,
        2.7166
      ],
      "axis": "z",
      "openings": []
    },
    {
      "id": "main-closet-return",
      "bounds": [
        3.2766,
        2.7166,
        4.05107,
        2.78809
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "main-entry",
      "bounds": [
        3.77703,
        2.78809,
        3.88426,
        3.86043
      ],
      "axis": "z",
      "openings": [
        {
          "kind": "passage",
          "start": 2.8,
          "end": 3.82469,
          "profile": "door"
        }
      ]
    },
    {
      "id": "ensuite-north",
      "bounds": [
        0.34553,
        3.86043,
        3.88426,
        3.93192
      ],
      "axis": "x",
      "openings": [
        {
          "kind": "passage",
          "start": 1.63234,
          "end": 2.59745,
          "profile": "door"
        }
      ]
    },
    {
      "id": "bath-service-spine",
      "bounds": [
        2.68085,
        3.93192,
        2.75234,
        7.25618
      ],
      "axis": "z",
      "openings": [
        {
          "kind": "passage",
          "start": 6.25533,
          "end": 7.20852,
          "profile": "door"
        }
      ]
    },
    {
      "id": "bath-divider",
      "bounds": [
        0.34553,
        5.4332,
        2.68085,
        5.71916
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "bath-south",
      "bounds": [
        0.34553,
        7.25618,
        2.75234,
        7.31575
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "linen-return",
      "bounds": [
        2.02553,
        7.31575,
        2.16851,
        7.9949
      ],
      "axis": "z",
      "openings": []
    },
    {
      "id": "laundry-east",
      "bounds": [
        3.71745,
        3.93192,
        3.88426,
        4.98043
      ],
      "axis": "z",
      "openings": []
    },
    {
      "id": "laundry-opening",
      "bounds": [
        2.75234,
        4.93277,
        3.71745,
        5.00426
      ],
      "axis": "x",
      "openings": [
        {
          "kind": "passage",
          "start": 2.8,
          "end": 3.64596,
          "profile": "door"
        }
      ]
    },
    {
      "id": "bedroom-north",
      "bounds": [
        3.89618,
        6.54129,
        7.23235,
        6.91065
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "bedroom-entry",
      "bounds": [
        3.89618,
        6.91065,
        3.96766,
        8.20937
      ],
      "axis": "z",
      "openings": [
        {
          "kind": "passage",
          "start": 6.97022,
          "end": 7.93533,
          "profile": "door"
        }
      ]
    },
    {
      "id": "bedroom-closet-return",
      "bounds": [
        3.22894,
        8.20937,
        3.96766,
        8.32852
      ],
      "axis": "x",
      "openings": []
    },
    {
      "id": "bedroom-closet-back",
      "bounds": [
        3.22894,
        8.32852,
        3.30043,
        9.67491
      ],
      "axis": "z",
      "openings": []
    }
  ],
  "rails": [
    {
      "id": "balcony-north",
      "bounds": [
        7.45873,
        1.37021,
        9.13874,
        1.42979
      ]
    },
    {
      "id": "balcony-east",
      "bounds": [
        9.07916,
        1.42979,
        9.13874,
        5.70724
      ]
    },
    {
      "id": "balcony-south",
      "bounds": [
        7.55405,
        5.64767,
        9.07916,
        5.7549
      ]
    }
  ],
  "entryBoundary": [
    0.40511,
    9.7464,
    1.4417,
    9.84171
  ],
  "spawn": {
    "x": 0.97702,
    "z": 9.15065,
    "yaw": 0.91
  },
  "roomLabels": [
    {
      "name": "主卧",
      "point": [
        1.87064,
        2.20426
      ]
    },
    {
      "name": "客厅",
      "point": [
        5.62384,
        2.4783
      ]
    },
    {
      "name": "厨房",
      "point": [
        5.71916,
        5.60001
      ]
    },
    {
      "name": "次卧",
      "point": [
        5.61192,
        8.43576
      ]
    },
    {
      "name": "套卫",
      "point": [
        1.52511,
        4.64681
      ]
    },
    {
      "name": "公卫",
      "point": [
        1.52511,
        6.5532
      ]
    },
    {
      "name": "玄关",
      "point": [
        1.90639,
        8.99576
      ]
    },
    {
      "name": "阳台",
      "point": [
        8.26895,
        3.81277
      ]
    }
  ]
};
