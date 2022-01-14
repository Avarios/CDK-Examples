using Amazon.CDK;
using System;
using System.Collections.Generic;
using System.Text;

namespace Piwigo
{
    internal class ComputeStack : NestedStack
    {
        public ComputeStack(Constructs.Construct scope, string id) : base(scope, id, null)
        {
        }
    }
}
